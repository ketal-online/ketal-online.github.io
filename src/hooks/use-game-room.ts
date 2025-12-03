import { useEffect, useState, useRef } from 'react'
import { joinRoom } from 'trystero/supabase'

const config = {
  appId: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY
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
}

export function useGameRoom(roomId: string, userName: string) {
  const [peers, setPeers] = useState<Peer[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const roomRef = useRef<ReturnType<typeof joinRoom> | null>(null)
  const sendNameRef = useRef<((name: string, target?: string | string[]) => void) | null>(null)
  const [sendMessageAction, setSendMessageAction] = useState<((data: Omit<Message, 'id' | 'senderId'>, target?: string | string[]) => void) | null>(null)

  useEffect(() => {
    if (!roomId) return

    // Join the room
    const room = joinRoom(config, roomId)
    roomRef.current = room

    // Handle peers joining
    const [sendName, getName] = room.makeAction<string>('name')
    sendNameRef.current = sendName
    
    room.onPeerJoin((peerId) => {
      console.log('Peer joined:', peerId)
      // Send my name to the new peer
      sendName(userName, peerId)
      // Add peer to list (initially without name, will receive it shortly)
      setPeers(prev => [...prev, { id: peerId, name: 'Anonymous', isHost: false }])
    })

    room.onPeerLeave((peerId) => {
      console.log('Peer left:', peerId)
      setPeers(prev => prev.filter(p => p.id !== peerId))
    })

    // Handle name exchange
    getName((name, peerId) => {
      setPeers(prev => prev.map(p => p.id === peerId ? { ...p, name } : p))
    })

    // Handle chat messages
    const [sendMsg, getMsg] = room.makeAction<Omit<Message, 'id' | 'senderId'>>('chat')
    setSendMessageAction(() => sendMsg)

    getMsg((payload, peerId) => {
      const newMessage: Message = {
        id: crypto.randomUUID(),
        senderId: peerId,
        senderName: payload.senderName, // Use name from payload to be safe
        text: payload.text,
        timestamp: payload.timestamp
      }
      setMessages(prev => [...prev, newMessage])
    })

    // Initial broadcast of name (in case we are joining an existing room)
    // Wait a bit for connection? Trystero handles this usually via onPeerJoin for others.
    // But for existing peers, we might want to announce ourselves?
    // Trystero's joinRoom doesn't give a list of existing peers immediately.
    // Usually existing peers will see us join and we will see them join (or they are already there).
    // If they are already there, onPeerJoin fires for them? No, onPeerJoin fires when *someone else* joins.
    // Trystero is mesh.
    
    return () => {
      room.leave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]) // Re-run if roomId changes.

  // Broadcast name change
  useEffect(() => {
    if (sendNameRef.current && userName) {
      sendNameRef.current(userName)
    }
  }, [userName])

  const sendMessage = (text: string) => {
    if (!sendMessageAction) return

    const msgPayload = {
      senderName: userName,
      text,
      timestamp: Date.now()
    }

    // Send to all peers
    sendMessageAction(msgPayload)

    // Add to my own list
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      senderId: 'me',
      senderName: userName,
      text,
      timestamp: Date.now()
    }])
  }

  return {
    peers,
    messages,
    sendMessage
  }
}

