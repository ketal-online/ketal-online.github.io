import { useEffect, useState, useRef, useCallback } from 'react'
import { joinRoom, selfId, type Room } from 'trystero/nostr'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/language-context'

// Use a unique app ID for Nostr signaling
const config = {
  appId: 'ketal-online-game-2025'
}

export type Peer = {
  id: string
  name: string
  isHost: boolean
}

export type Message = {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: number
  persisted?: boolean
}

// Simple payload - just the name, no complex flags needed
type PeerInfo = {
  name: string
}

type ChatPayload = {
  senderName: string
  text: string
  timestamp: number
}

export function useGameRoom(roomSlug: string, roomDbId: string, userName: string, userId?: string) {
  const { t } = useLanguage()
  const [peers, setPeers] = useState<Peer[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  
  // Refs to avoid stale closures
  const roomRef = useRef<Room | null>(null)
  const userNameRef = useRef(userName)
  const peersRef = useRef<Peer[]>([]) // Mirror of peers state for use in callbacks
  const sendPeerInfoRef = useRef<((info: PeerInfo, target?: string | string[]) => void) | null>(null)
  const sendChatRef = useRef<((msg: ChatPayload, target?: string | string[]) => void) | null>(null)
  
  // Keep refs updated
  useEffect(() => {
    userNameRef.current = userName
  }, [userName])
  
  useEffect(() => {
    peersRef.current = peers
  }, [peers])

  // Load persisted messages from Supabase on mount
  useEffect(() => {
    if (!roomDbId) return

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomDbId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!error && data) {
        const loadedMessages: Message[] = data.map(m => ({
          id: m.id,
          senderId: m.sender_id || 'guest',
          senderName: m.sender_name,
          text: m.text,
          timestamp: new Date(m.created_at).getTime(),
          persisted: true
        }))
        setMessages(loadedMessages)
      }
    }

    loadMessages()
  }, [roomDbId])

  // Main P2P connection effect
  useEffect(() => {
    if (!roomSlug) return

    console.log('[P2P] Initializing room:', roomSlug, '| My selfId:', selfId)
    
    // Create a unique room namespace
    const roomId = `ketal-room-${roomSlug}`
    const room = joinRoom(config, roomId)
    roomRef.current = room

    // Create actions
    const [sendPeerInfo, getPeerInfo] = room.makeAction<PeerInfo>('peer-info')
    const [sendChat, getChat] = room.makeAction<ChatPayload>('chat')
    
    sendPeerInfoRef.current = sendPeerInfo
    sendChatRef.current = sendChat

    // Helper: send our info to a specific peer
    const sendMyInfoTo = (targetPeerId: string) => {
      const info: PeerInfo = { name: userNameRef.current }
      console.log('[P2P] Sending my info to', targetPeerId, ':', info)
      sendPeerInfo(info, targetPeerId)
    }

    // Handle peer joining - this is the ONLY place we initiate info exchange
    room.onPeerJoin((peerId) => {
      console.log('[P2P] Peer joined:', peerId)
      
      // Add peer with temporary name
      setPeers(prev => {
        if (prev.some(p => p.id === peerId)) {
          return prev
        }
        return [...prev, { id: peerId, name: 'Connecting...', isHost: false }]
      })
      
      // Send our info to the new peer (they will respond once)
      setTimeout(() => sendMyInfoTo(peerId), 100)
    })

    // Handle peer leaving
    room.onPeerLeave((peerId) => {
      console.log('[P2P] Peer left:', peerId)
      setPeers(prev => prev.filter(p => p.id !== peerId))
    })

    // Handle receiving peer info
    // Pattern: Only respond if we haven't received their real name yet
    getPeerInfo((info, peerId) => {
      console.log('[P2P] Received peer info from', peerId, ':', info)
      
      // Check if we already have this peer's real name (not "Connecting...")
      const existingPeer = peersRef.current.find(p => p.id === peerId)
      const alreadyKnown = existingPeer && existingPeer.name !== 'Connecting...'
      
      // Toast on name change
      if (alreadyKnown && existingPeer.name !== info.name) {
        toast.info(t('players.name_changed').replace('{0}', existingPeer.name).replace('{1}', info.name))
      }
      
      // Update peer name
      setPeers(prev => {
        const existing = prev.find(p => p.id === peerId)
        if (existing) {
          return prev.map(p => p.id === peerId ? { ...p, name: info.name } : p)
        } else {
          // Peer sent info before onPeerJoin fired
          return [...prev, { id: peerId, name: info.name, isHost: false }]
        }
      })
      
      // Only respond if we didn't already know this peer
      // This prevents the infinite loop: A->B, B->A, done.
      if (!alreadyKnown) {
        console.log('[P2P] Responding with my info to', peerId)
        sendMyInfoTo(peerId)
      }
    })

    // Handle receiving chat messages
    getChat((payload, peerId) => {
      console.log('[P2P] Received chat from', peerId, ':', payload)
      
      const newMessage: Message = {
        id: crypto.randomUUID(),
        senderId: peerId,
        senderName: payload.senderName,
        text: payload.text,
        timestamp: payload.timestamp,
        persisted: false
      }
      setMessages(prev => [...prev, newMessage])
    })

    // Mark as connected
    queueMicrotask(() => setConnected(true))
    console.log('[P2P] Room initialized, connected')

    // Cleanup
    return () => {
      console.log('[P2P] Leaving room:', roomSlug)
      room.leave()
      roomRef.current = null
      sendPeerInfoRef.current = null
      sendChatRef.current = null
      setPeers([])
      setConnected(false)
    }
  }, [roomSlug])

  // Broadcast name changes to all peers
  useEffect(() => {
    if (!connected || !sendPeerInfoRef.current) return
    
    console.log('[P2P] Broadcasting name update:', userName)
    // Just send the name update to all peers
    sendPeerInfoRef.current({ name: userName })
  }, [userName, connected])

  // Send message function
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return

    const timestamp = Date.now()
    const payload: ChatPayload = {
      senderName: userNameRef.current,
      text: text.trim(),
      timestamp
    }

    // Send via P2P
    if (sendChatRef.current) {
      console.log('[P2P] Sending chat:', payload)
      sendChatRef.current(payload)
    }

    // Add to local state
    const localMessage: Message = {
      id: crypto.randomUUID(),
      senderId: 'me',
      senderName: userNameRef.current,
      text: text.trim(),
      timestamp,
      persisted: false
    }
    setMessages(prev => [...prev, localMessage])

    // Persist to Supabase
    if (roomDbId) {
      try {
        await supabase.from('messages').insert({
          room_id: roomDbId,
          sender_id: userId || null,
          sender_name: userNameRef.current,
          text: text.trim()
        })
      } catch (error) {
        console.error('[P2P] Failed to persist message:', error)
      }
    }
  }, [roomDbId, userId])

  return {
    peers,
    messages,
    sendMessage,
    connected,
    selfId // Export selfId for debugging
  }
}

