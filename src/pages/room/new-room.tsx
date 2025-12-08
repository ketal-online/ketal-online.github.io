import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language-context'
import { generateRoomSlug } from '@/lib/slug-generator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2, Play, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

const MAX_SLUG_RETRIES = 5

export default function RoomsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [joinRoomSlug, setJoinRoomSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [fetchingRooms, setFetchingRooms] = useState(true)
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchRooms()
    } else {
      setFetchingRooms(false)
    }
  }, [user])

  const fetchRooms = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching rooms:', error)
    } else {
      setRooms(data || [])
    }
    setFetchingRooms(false)
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let attempts = 0
    let created = false

    while (attempts < MAX_SLUG_RETRIES && !created) {
      const slug = generateRoomSlug()
      
      const { data, error } = await supabase
        .from('rooms')
        .insert([
          {
            name,
            slug,
            password: password || null,
            created_by: user ? user.id : null,
          },
        ])
        .select()
        .single()

      if (error) {
        // Check if it's a unique constraint violation on slug
        if (error.code === '23505' && error.message.includes('slug')) {
          attempts++
          continue
        }
        console.error('Error creating room:', error)
        toast.error('Failed to create room')
        setLoading(false)
        return
      } else if (data) {
        created = true
        navigate(`/room/${data.slug}`)
        return
      }
    }

    if (!created) {
      toast.error('Failed to create room after multiple attempts. Please try again.')
      setLoading(false)
    }
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinRoomSlug) {
      navigate(`/room/${joinRoomSlug}`)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    setDeletingRoomId(roomId)
    
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
        .eq('created_by', user?.id) // Extra safety check
      
      if (error) {
        console.error('Error deleting room:', error)
        toast.error('Failed to delete room')
      } else {
        setRooms(rooms.filter(r => r.id !== roomId))
        toast.success('Room deleted')
      }
    } catch (err) {
      console.error('Error deleting room:', err)
      toast.error('Failed to delete room')
    } finally {
      setDeletingRoomId(null)
    }
  }

  const handleCopySlug = async (slug: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/room/${slug}`
    await navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    toast.success('Link copied!')
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8 px-4">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
          {user ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">{t('room.your_rooms')}</h2>
              {fetchingRooms ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
              ) : rooms.length === 0 ? (
                <p className="text-muted-foreground">{t('room.no_rooms')}</p>
              ) : (
                <div className="space-y-4">
                  {rooms.map(room => (
                    <Card key={room.id}>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <CardDescription className="text-xs font-mono truncate">
                          {room.slug}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 pt-2 flex justify-between gap-2">
                        <div className="flex gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteRoom(room.id)}
                            disabled={deletingRoomId === room.id}
                          >
                            {deletingRoomId === room.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">{t('room.delete')}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopySlug(room.slug)}
                          >
                            {copiedSlug === room.slug ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Button size="sm" asChild>
                          <Link to={`/room/${room.slug}`}>
                            <Play className="w-4 h-4 mr-1" /> {t('room.join')}
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('welcome.title')}</CardTitle>
                <CardDescription>{t('welcome.description')}</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('room.join')}</CardTitle>
              <CardDescription>Enter a room slug to join an existing game.</CardDescription>
            </CardHeader>
            <form onSubmit={handleJoinRoom}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomSlug">Room Slug</Label>
                  <Input
                    id="roomSlug"
                    placeholder="e.g. 42-vodkas-belges-qui-deboitent"
                    value={joinRoomSlug}
                    onChange={(e) => setJoinRoomSlug(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  {t('room.join_room')}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('room.create')}</CardTitle>
              <CardDescription>
                {user ? 'Start a new game session' : 'Start a new game session as Guest'}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateRoom}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('room.name')}</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Game"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('room.password.optional')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('room.password.placeholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loading ? t('room.creating') : t('room.create')}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
