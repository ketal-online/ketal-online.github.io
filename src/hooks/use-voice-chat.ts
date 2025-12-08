import { useEffect, useState, useRef, useCallback } from 'react'
import { joinRoom, type Room } from 'trystero/nostr'

// Use a unique app ID for Nostr signaling
const config = {
  appId: 'ketal-online-voice-2025'
}

type VoiceInfo = {
  name: string
}

type VoiceState = {
  peerId: string
  peerName: string
  stream: MediaStream
}

export function useVoiceChat(roomSlug: string, userName: string, enabled: boolean) {
  const [isMuted, setIsMuted] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [remoteStreams, setRemoteStreams] = useState<VoiceState[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  
  const roomRef = useRef<Room | null>(null)
  const peerNamesRef = useRef<Map<string, string>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  
  // Store userName in a ref to avoid effect re-runs
  const userNameRef = useRef(userName)
  useEffect(() => {
    userNameRef.current = userName
  }, [userName])

  // Initialize voice room
  useEffect(() => {
    if (!roomSlug || !enabled) {
      // Cleanup if disabled
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
        setLocalStream(null)
      }
      if (roomRef.current) {
        roomRef.current.leave()
        roomRef.current = null
      }
      setRemoteStreams([])
      setIsConnected(false)
      return
    }

    const initVoice = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        
        // Start muted
        stream.getAudioTracks().forEach(track => {
          track.enabled = false
        })
        
        localStreamRef.current = stream
        setLocalStream(stream)
        
        // Join voice room (separate from main room)
        const room = joinRoom(config, `ketal-voice-${roomSlug}`)
        roomRef.current = room
        
        // Set up name exchange for voice
        const [sendName, getName] = room.makeAction<VoiceInfo>('voice-name')
        
        // Function to broadcast name
        const broadcastName = (targetPeerId?: string) => {
          const info: VoiceInfo = { name: userNameRef.current }
          console.log('[Voice] Broadcasting name:', info, targetPeerId ? `to ${targetPeerId}` : 'to all')
          if (targetPeerId) {
            sendName(info, targetPeerId)
          } else {
            sendName(info)
          }
        }
        
        // Handle peer connections
        room.onPeerJoin(async (peerId) => {
          console.log('[Voice] Peer joined:', peerId)
          
          // Send name to new peer
          setTimeout(() => broadcastName(peerId), 50)
          
          // Add stream to peer
          if (localStreamRef.current) {
            room.addStream(localStreamRef.current, peerId)
          }
        })
        
        room.onPeerLeave((peerId) => {
          console.log('[Voice] Peer left:', peerId)
          peerNamesRef.current.delete(peerId)
          setRemoteStreams(prev => prev.filter(s => s.peerId !== peerId))
        })
        
        // Handle name exchange
        // Pattern: Only respond if we didn't already know this peer's real name
        getName((info, peerId) => {
          console.log('[Voice] Received name from', peerId, ':', info)
          
          // Check if we already have this peer's real name
          const alreadyKnown = peerNamesRef.current.has(peerId)
          
          // Store the name
          peerNamesRef.current.set(peerId, info.name)
          setRemoteStreams(prev => prev.map(s => 
            s.peerId === peerId ? { ...s, peerName: info.name } : s
          ))
          
          // Only respond if we didn't already know this peer
          // This prevents infinite loop: A->B, B->A, done.
          if (!alreadyKnown) {
            console.log('[Voice] Responding with my name to', peerId)
            broadcastName(peerId)
          }
        })
        
        // Handle incoming streams
        room.onPeerStream((stream, peerId) => {
          console.log('[Voice] Received stream from:', peerId)
          setRemoteStreams(prev => {
            // Remove existing stream from this peer if any
            const filtered = prev.filter(s => s.peerId !== peerId)
            return [...filtered, {
              peerId,
              peerName: peerNamesRef.current.get(peerId) || 'Anonymous',
              stream
            }]
          })
        })
        
        // Mark as connected after setup is complete (defer to avoid React warning)
        queueMicrotask(() => setIsConnected(true))
        console.log('[Voice] Connected to room:', roomSlug)
        
      } catch (error) {
        console.error('[Voice] Failed to initialize:', error)
      }
    }
    
    initVoice()
    
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
      }
      if (roomRef.current) {
        roomRef.current.leave()
        roomRef.current = null
      }
      peerNamesRef.current.clear()
      setRemoteStreams([])
      setIsConnected(false)
      setLocalStream(null)
    }
  }, [roomSlug, enabled]) // Only depend on roomSlug and enabled, use refs for mutable values

  // Handle mute/unmute
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted
      })
    }
  }, [isMuted, localStream])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  return {
    isMuted,
    toggleMute,
    isConnected,
    remoteStreams,
    localStream
  }
}
