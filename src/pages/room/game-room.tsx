import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useGameRoom } from '@/hooks/use-game-room'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { MessageSquare, Send, Users, Smile } from 'lucide-react'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type RoomDetails = {
  id: string
  name: string
  password?: string | null
  created_by: string
}

export default function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user } = useAuth()
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')

  // We only initialize Trystero if authorized
  const { peers, messages, sendMessage } = useGameRoom(
    isAuthorized && roomId ? roomId : '',
    user?.email?.split('@')[0] || 'Guest' // Simple username derivation
  )

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
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Main Game Area */}
      <div className="flex-1 p-4 bg-muted/10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{roomDetails?.name}</h1>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>{peers.length + 1} Online</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder for game content */}
          <Card>
            <CardHeader>
              <CardTitle>Game Board</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Waiting for players...</p>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Peers:</h3>
                <ul className="list-disc pl-5">
                  <li>Me ({user?.email?.split('@')[0] || 'Guest'})</li>
                  {peers.map(p => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Sidebar (Desktop) */}
      <div className="hidden lg:flex w-80 flex-col border-l bg-background">
        <div className="p-4 border-b font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Chat
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.senderId === 'me' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-2 text-sm ${msg.senderId === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {msg.text}
                </div>
                <span className="text-xs text-muted-foreground mt-1">{msg.senderName}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="relative flex-1 flex gap-2">
               <Input 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                placeholder="Type a message..." 
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" type="button">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </PopoverContent>
              </Popover>
            </div>
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile Chat Sheet */}
      <div className="lg:hidden fixed bottom-4 right-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
              <MessageSquare className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[90%] sm:w-[400px] flex flex-col p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Chat</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === 'me' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-2 text-sm ${msg.senderId === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {msg.text}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{msg.senderName}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  placeholder="Type a message..." 
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

