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
  const [sendMessageAction, setSendMessageAction] = useState<((data: Omit<Message, 'id' | 'senderId'>, target?: string | string[]) => void) | null>(null)

  useEffect(() => {
    if (!roomId || !userName) return

    // Join the room
    const room = joinRoom(config, roomId)
    roomRef.current = room

    // Handle peers joining
    const [sendName, getName] = room.makeAction<string>('name')
    
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

    return () => {
      room.leave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]) // Re-run if roomId changes. userName change shouldn't trigger reconnect ideally, but for now it's fine.

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

