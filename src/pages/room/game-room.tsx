import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useGameRoom } from '@/hooks/use-game-room'
import { useLayout } from '@/lib/layout-context'
import { getAvatarUrl } from '@/lib/dicebear'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { MessageSquare, Send, Users, Smile, Edit2, Check, X, ChevronDown, ChevronRight, PanelRight } from 'lucide-react'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from "@/lib/utils"

type RoomDetails = {
  id: string
  name: string
  password?: string | null
  created_by: string
}

export default function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user, updateProfile } = useAuth()
  const { rightSidebarOpen, setRightSidebarOpen, setShowRightSidebarTrigger } = useLayout()
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Name editing state
  const [displayName, setDisplayName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name)
    } else if (user?.email) {
      setDisplayName(user.email.split('@')[0])
    } else {
      setDisplayName('Guest')
    }
  }, [user])

  // We only initialize Trystero if authorized
  const { peers, messages, sendMessage } = useGameRoom(
    isAuthorized && roomId ? roomId : '',
    displayName
  )

  useEffect(() => {
    setShowRightSidebarTrigger(true)
    return () => setShowRightSidebarTrigger(false)
  }, [setShowRightSidebarTrigger])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
    if (!rightSidebarOpen && messages.length > 0) {
      setUnreadCount(prev => prev + 1)
    }
  }, [messages])

  useEffect(() => {
    if (rightSidebarOpen) {
      setUnreadCount(0)
    }
  }, [rightSidebarOpen])

  const handleNameSave = async () => {
    if (!tempName.trim()) return
    
    setDisplayName(tempName)
    setIsEditingName(false)

    if (user) {
      try {
        await updateProfile({ full_name: tempName })
      } catch (error) {
        console.error('Failed to update profile name:', error)
        // Optionally revert or show error
      }
    }
  }

  const startEditingName = () => {
    setTempName(displayName)
    setIsEditingName(true)
  }

  useEffect(() => {
    if (!roomId) return

    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (error) {
        console.error('Error fetching room:', error)
        // Handle 404 or error
      } else {
        setRoomDetails(data)
        // If no password, authorize immediately
        if (!data.password) {
          setIsAuthorized(true)
        }
      }
      setLoading(false)
    }

    fetchRoom()
  }, [roomId])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomDetails?.password === passwordInput) {
      setIsAuthorized(true)
    } else {
      alert('Incorrect password')
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

  if (loading) return <div className="p-8 text-center">Loading room...</div>

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Enter Room Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              <Button type="submit" className="w-full">Join Room</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height))] overflow-hidden relative">
      {/* Main Game Area */}
      <div className="flex-1 overflow-hidden bg-muted/20 p-4 md:p-6 relative">
        <Card className="h-full w-full overflow-hidden border-none shadow-none bg-transparent">
           <CardContent className="flex h-full items-center justify-center p-0">
             <div className="text-center">
               <h3 className="text-lg font-semibold">Game Board</h3>
               <p className="text-muted-foreground">Game content will appear here</p>
             </div>
           </CardContent>
        </Card>
        
        {/* Floating Sidebar Toggle Button */}
        {!rightSidebarOpen && (
          <Button
            variant="default"
            size="icon"
            className="absolute bottom-4 right-4 z-50 shadow-lg rounded-full h-12 w-12"
            onClick={() => setRightSidebarOpen(true)}
          >
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Right Sidebar */}
      {rightSidebarOpen && (
        <div className="w-80 border-l bg-background flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out relative shadow-xl z-40">
          {/* Close Button for Mobile/Desktop if needed, or just toggle back */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 z-10 md:hidden" 
            onClick={() => setRightSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Room Header */}
          <div className="p-4 border-b flex items-center justify-between bg-muted/10 shrink-0 pr-10 md:pr-4">
             <h2 className="font-semibold truncate max-w-[150px]" title={roomDetails?.name}>{roomDetails?.name || 'Game Room'}</h2>
             
             <div className="flex items-center gap-1">
               <Popover>
               <PopoverTrigger asChild>
                 <Button variant="secondary" size="sm" className="h-7 px-2 text-xs rounded-full hover:bg-muted-foreground/20">
                    <Users className="mr-1 h-3 w-3" />
                    {peers.length + 1}
                 </Button>
               </PopoverTrigger>
               <PopoverContent align="end" className="w-60 p-2">
                  <h4 className="font-medium text-sm mb-2 px-2">Players</h4>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {/* Me */}
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={getAvatarUrl(displayName)} />
                        <AvatarFallback>{displayName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate flex-1 font-medium">{displayName} <span className="text-muted-foreground font-normal">(Me)</span></span>
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
             
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRightSidebarOpen(false)}>
                <PanelRight className="h-4 w-4" />
             </Button>
             </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
             <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                   {messages.map((msg) => {
                      const isMe = msg.senderId === 'me';
                      return (
                        <div key={msg.id} className={cn("flex gap-2 items-end", isMe ? "flex-row-reverse" : "flex-row")}>
                           <Avatar className="h-6 w-6 shrink-0 mb-1">
                              <AvatarImage src={getAvatarUrl(msg.senderName)} />
                              <AvatarFallback>{msg.senderName[0]}</AvatarFallback>
                           </Avatar>
                           <div className={cn(
                             "flex flex-col max-w-[80%] min-w-0", 
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
                              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                {isMe ? '' : msg.senderName + ' • '}
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                        </div>
                      );
                   })}
                   <div ref={scrollRef} />
                </div>
             </ScrollArea>

             {/* Chat Input Area */}
             <div className="p-4 border-t bg-background mt-auto shrink-0">
                <div className="flex items-center justify-between mb-2">
                   <Popover>
                      <PopoverTrigger asChild>
                         <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground -ml-2">
                            Posting as <span className="font-medium ml-1 text-foreground">{displayName}</span> <Edit2 className="ml-1 h-3 w-3" />
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="start">
                         <div className="space-y-2">
                            <h4 className="font-medium leading-none text-sm">Change Name</h4>
                            <div className="flex gap-2">
                                <Input 
                                   defaultValue={displayName}
                                   onChange={(e) => setTempName(e.target.value)}
                                   placeholder="New name"
                                   className="h-8"
                                />
                                <Button size="sm" className="h-8" onClick={() => {
                                    if (tempName.trim()) {
                                        handleNameSave();
                                    }
                                }}>Save</Button>
                            </div>
                         </div>
                      </PopoverContent>
                   </Popover>
                </div>
                <div className="flex gap-2 items-end">
                   <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground">
                          <Smile className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-none shadow-lg" align="start" side="top">
                        <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                      </PopoverContent>
                    </Popover>
                   <Input 
                      placeholder="Type a message..." 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                      className="flex-1 min-h-[2.25rem]"
                   />
                   <Button size="icon" onClick={handleSendMessage} className="shrink-0 h-9 w-9">
                      <Send className="h-4 w-4" />
                   </Button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

