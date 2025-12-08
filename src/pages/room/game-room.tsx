import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useGameRoom } from '@/hooks/use-game-room'
import { useVoiceChat } from '@/hooks/use-voice-chat'
import { useLanguage } from '@/lib/language-context'
import { getAvatarUrl } from '@/lib/dicebear'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { MessageSquare, Send, Users, Smile, Edit2, X, Mic, MicOff, Phone, PhoneOff } from 'lucide-react'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { cn } from "@/lib/utils"

type RoomDetails = {
  id: string
  slug: string
  name: string
  password?: string | null
  created_by: string
}

export default function GameRoomPage() {
  const { roomSlug } = useParams<{ roomSlug: string }>()
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  const { t } = useLanguage()
  
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Track seen messages for unread badge - simple boolean state
  const [hasUnread, setHasUnread] = useState(false)
  // Track initial load to avoid toast spam on connect
  const initialLoadRef = useRef(true)
  
  // Name editing state - initialize with a default value immediately
  const [displayName, setDisplayName] = useState(() => {
    // Try to get initial name synchronously
    return 'Guest'
  })
  const [tempName, setTempName] = useState('')
  
  // Voice chat state
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  
  // Update display name when user info is available
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name)
    } else if (user?.email) {
      setDisplayName(user.email.split('@')[0])
    }
    // Don't reset to 'Guest' if user is not loaded yet - keep the current name
  }, [user])

  // We only initialize P2P if authorized
  const { peers, messages, sendMessage, connected } = useGameRoom(
    isAuthorized && roomSlug ? roomSlug : '',
    isAuthorized && roomDetails ? roomDetails.id : '',
    displayName,
    user?.id
  )

  // Voice chat
  const { isMuted, toggleMute, isConnected: voiceConnected, remoteStreams } = useVoiceChat(
    isAuthorized && roomSlug ? roomSlug : '',
    displayName,
    voiceEnabled
  )

  // Handle remote audio streams
  useEffect(() => {
    remoteStreams.forEach(({ peerId, stream }) => {
      let audio = audioElementsRef.current.get(peerId)
      if (!audio) {
        audio = new Audio()
        audio.autoplay = true
        audioElementsRef.current.set(peerId, audio)
      }
      if (audio.srcObject !== stream) {
        audio.srcObject = stream
      }
    })
    
    // Cleanup old audio elements
    audioElementsRef.current.forEach((audio, peerId) => {
      if (!remoteStreams.find(s => s.peerId === peerId)) {
        audio.srcObject = null
        audioElementsRef.current.delete(peerId)
      }
    })
  }, [remoteStreams])

  // Count unread messages - now just tracking if there are any unread
  const prevMessagesLengthRef = useRef(0)

  // Mark messages as seen when chat is open
  useEffect(() => {
    if (chatOpen) {
      setHasUnread(false)
    }
  }, [chatOpen])

  // Track new messages for unread badge (skip initial load)
  useEffect(() => {
    const currentLength = messages.length
    const prevLength = prevMessagesLengthRef.current
    
    // On initial load (first messages received), just store the count without marking unread
    if (initialLoadRef.current && currentLength > 0) {
      prevMessagesLengthRef.current = currentLength
      initialLoadRef.current = false
      return
    }
    
    // New message arrived (not initial load)
    if (currentLength > prevLength && prevLength > 0) {
      const lastMessage = messages[currentLength - 1]
      if (lastMessage.senderId !== 'me') {
        if (!chatOpen) {
          setHasUnread(true)
          // Single toast for new message, not on initial load
          toast(lastMessage.senderName, {
            description: lastMessage.text.length > 50 
              ? lastMessage.text.slice(0, 50) + '...' 
              : lastMessage.text,
            duration: 3000,
          })
        }
      }
    }
    
    prevMessagesLengthRef.current = currentLength
  }, [messages, chatOpen])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatOpen && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, chatOpen])

  const handleNameSave = async () => {
    if (!tempName.trim()) return
    
    setDisplayName(tempName)

    if (user) {
      try {
        await updateProfile({ full_name: tempName })
      } catch (error) {
        console.error('Failed to update profile name:', error)
      }
    }
  }

  useEffect(() => {
    if (!roomSlug) return

    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('slug', roomSlug)
        .single()

      if (error || !data) {
        console.error('Error fetching room:', error)
        navigate('/')
        return
      }
      
      setRoomDetails(data)
      // If no password, authorize immediately
      if (!data.password) {
        setIsAuthorized(true)
      }
      setLoading(false)
    }

    fetchRoom()
  }, [roomSlug, navigate])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomDetails?.password === passwordInput) {
      setIsAuthorized(true)
    } else {
      toast.error('Incorrect password')
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    sendMessage(chatInput)
    setChatInput('')
  }

  const onEmojiClick = (emojiObject: EmojiClickData) => {
    setChatInput(prev => prev + emojiObject.emoji)
  }

  const toggleChat = useCallback(() => {
    setChatOpen(prev => !prev)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height))]">
      <div className="text-center text-muted-foreground">{t('room.loading')}</div>
    </div>
  )

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height))] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('room.enter_password')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder={t('room.password')}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              <Button type="submit" className="w-full">{t('room.join_room')}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-var(--header-height))] overflow-hidden relative">
      {/* Main Game Area */}
      <div className="h-full overflow-auto bg-muted/20 p-4 md:p-6">
        <Card className="h-full w-full overflow-hidden border-none shadow-none bg-transparent">
          <CardContent className="flex h-full items-center justify-center p-0">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{t('room.game_board')}</h3>
              <p className="text-muted-foreground">{t('room.game_content')}</p>
              {connected && (
                <p className="text-sm text-green-600 mt-2">
                  ● Connected • {peers.length + 1} {t('players.title').toLowerCase()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat FAB - single floating button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="default"
          size="icon"
          className="shadow-lg rounded-full h-14 w-14 relative"
          onClick={toggleChat}
        >
          <MessageSquare className="h-6 w-6" />
          {hasUnread && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
            </span>
          )}
        </Button>
      </div>

      {/* Floating Chat Panel */}
      {chatOpen && (
        <div className="fixed bottom-20 right-4 z-40 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-h-[60vh] bg-background/95 backdrop-blur-sm border rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          {/* Chat Header */}
          <div className="p-3 border-b flex items-center justify-between bg-muted/50 shrink-0">
            <h2 className="font-semibold truncate" title={roomDetails?.name}>
              {roomDetails?.name || 'Chat'}
            </h2>
            
            <div className="flex items-center gap-1">
              {/* Voice Controls in header */}
              <Button
                variant={voiceEnabled ? (isMuted ? "destructive" : "default") : "ghost"}
                size="sm"
                className={cn(
                  "h-7 px-2 text-xs gap-1",
                  voiceEnabled && voiceConnected && !isMuted && "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => {
                  if (voiceEnabled && voiceConnected) {
                    toggleMute()
                  } else {
                    setVoiceEnabled(prev => !prev)
                  }
                }}
                title={voiceEnabled ? (isMuted ? t('voice.unmute') : t('voice.mute')) : t('voice.join')}
              >
                {voiceEnabled ? (
                  <>
                    {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    {voiceConnected && (
                      <span className="hidden sm:inline">{isMuted ? t('voice.muted') : t('voice.live')}</span>
                    )}
                  </>
                ) : (
                  <>
                    <Phone className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('voice.join')}</span>
                  </>
                )}
              </Button>
              
              {/* Leave voice call button (when in call) */}
              {voiceEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setVoiceEnabled(false)}
                  title={t('voice.leave')}
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                </Button>
              )}
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-7 px-2 text-xs rounded-full">
                    <Users className="mr-1 h-3 w-3" />
                    {peers.length + 1}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-60 p-2">
                  <h4 className="font-medium text-sm mb-2 px-2">{t('players.title')}</h4>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {/* Me */}
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={getAvatarUrl(displayName)} />
                        <AvatarFallback>{displayName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate flex-1 font-medium">
                        {displayName} <span className="text-muted-foreground font-normal">({t('players.me')})</span>
                      </span>
                    </div>
                    {/* Peers */}
                    {peers.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={getAvatarUrl(p.name)} />
                          <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate flex-1">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleChat}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMe = msg.senderId === 'me'
                return (
                  <div key={msg.id} className={cn("flex gap-2 items-end", isMe ? "flex-row-reverse" : "flex-row")}>
                    <Avatar className="h-6 w-6 shrink-0 mb-1">
                      <AvatarImage src={getAvatarUrl(msg.senderName)} />
                      <AvatarFallback>{msg.senderName[0]}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "flex flex-col max-w-[75%] min-w-0", 
                      isMe ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "px-3 py-2 rounded-2xl text-sm break-words",
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-br-none" 
                          : "bg-muted text-foreground rounded-bl-none"
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                        {isMe ? '' : msg.senderName + ' • '}
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={scrollRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t bg-background shrink-0">
            <div className="flex items-center justify-between mb-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground -ml-2">
                    {t('chat.posting_as')} <span className="font-medium ml-1 text-foreground">{displayName}</span> <Edit2 className="ml-1 h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none text-sm">{t('chat.change_name')}</h4>
                    <div className="flex gap-2">
                      <Input 
                        defaultValue={displayName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="New name"
                        className="h-8"
                      />
                      <Button size="sm" className="h-8" onClick={() => {
                        if (tempName.trim()) {
                          handleNameSave()
                        }
                      }}>{t('chat.save')}</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground">
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none shadow-lg" align="start" side="top">
                  <EmojiPicker onEmojiClick={onEmojiClick} width={280} height={350} />
                </PopoverContent>
              </Popover>
              <Input 
                placeholder={t('chat.placeholder')}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 min-h-[2.25rem]"
              />
              <Button type="submit" size="icon" className="shrink-0 h-9 w-9">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
