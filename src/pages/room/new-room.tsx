import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2, Play } from 'lucide-react'

export default function RoomsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [fetchingRooms, setFetchingRooms] = useState(true)

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

    const { data, error } = await supabase
      .from('rooms')
      .insert([
        {
          name,
          password: password || null, // Store null if empty
          created_by: user ? user.id : null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating room:', error)
      setLoading(false)
      // TODO: Show error toast
    } else if (data) {
      navigate(`/room/${data.id}`)
    }
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinRoomId) {
      navigate(`/room/${joinRoomId}`)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId)
    if (error) {
        console.error('Error deleting room', error)
    } else {
        setRooms(rooms.filter(r => r.id !== roomId))
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8 px-4">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-8">
            {user ? (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Your Rooms</h2>
                    {fetchingRooms ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : rooms.length === 0 ? (
                        <p className="text-muted-foreground">No rooms created yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {rooms.map(room => (
                                <Card key={room.id}>
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-lg">{room.name}</CardTitle>
                                        <CardDescription className="text-xs">ID: {room.id}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="p-4 pt-2 flex justify-between">
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteRoom(room.id)}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                        </Button>
                                        <Button size="sm" asChild>
                                            <Link to={`/room/${room.id}`}>
                                                <Play className="w-4 h-4 mr-2" /> Join
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
                        <CardTitle>Welcome!</CardTitle>
                        <CardDescription>Log in to create and manage your own rooms.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link to="/login">Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Join Room</CardTitle>
                    <CardDescription>Enter a Room ID to join an existing game.</CardDescription>
                </CardHeader>
                <form onSubmit={handleJoinRoom}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="roomId">Room ID</Label>
                            <Input
                                id="roomId"
                                placeholder="e.g. 123e4567-e89b..."
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                            Join Room
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {user && (
                <Card>
                    <CardHeader>
                    <CardTitle>Create New Room</CardTitle>
                    <CardDescription>Start a new game session</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleCreateRoom}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="name">Room Name</Label>
                        <Input
                            id="name"
                            placeholder="My Awesome Game"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="password">Password (Optional)</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Leave empty for public room"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {loading ? 'Creating...' : 'Create Room'}
                        </Button>
                    </CardFooter>
                    </form>
                </Card>
            )}

            {!user && (
                <Card>
                    <CardHeader>
                    <CardTitle>Create New Room</CardTitle>
                    <CardDescription>Start a new game session as Guest</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleCreateRoom}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label htmlFor="name">Room Name</Label>
                        <Input
                            id="name"
                            placeholder="My Awesome Game"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="password">Password (Optional)</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Leave empty for public room"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {loading ? 'Creating...' : 'Create Room'}
                        </Button>
                    </CardFooter>
                    </form>
                </Card>
            )}
        </div>
      </div>
    </div>
  )
}
