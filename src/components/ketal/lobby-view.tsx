import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import type { PlayerMeta } from '@/lib/ketal/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/lib/dicebear'
import { Users, Play, Crown, Loader2 } from 'lucide-react'

interface LobbyProps {
  players: PlayerMeta[]
  selfId: string
  hostId: string
  isHost: boolean
  minPlayers: number
  deckSupportCount: number
  onStartGame: () => void
}

export function LobbyView({
  players,
  selfId,
  hostId,
  isHost,
  minPlayers,
  deckSupportCount,
  onStartGame,
}: LobbyProps) {
  const { t } = useLanguage()
  const canStart = players.length >= minPlayers

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-6 gap-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('ketal.game_lobby')}</h2>
        <p className="text-muted-foreground">
          {t('ketal.waiting_for_players_lobby')}
        </p>
      </div>

      {/* Player count */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
          <Users className="h-5 w-5 text-primary" />
          <span className="font-semibold">{players.length}</span>
          <span className="text-muted-foreground">
            / {minPlayers}+ {t('ketal.players_needed')}
          </span>
        </div>
      </div>

      {/* Deck info */}
      <div className="text-center text-sm text-muted-foreground">
        {deckSupportCount === 1 ? (
          t('ketal.using_one_deck')
        ) : (
          t('ketal.using_multiple_decks').replace('{0}', String(deckSupportCount))
        )}
      </div>

      {/* Players list */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-2">
          {players.map((player) => {
            const isMe = player.id === selfId
            const isPlayerHost = player.id === hostId

            return (
              <div
                key={player.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-all',
                  isMe && 'bg-primary/5 ring-1 ring-primary/20',
                  !isMe && 'bg-muted/30'
                )}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getAvatarUrl(player.name)} />
                  <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium truncate', isMe && 'text-primary')}>
                    {player.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isMe && <span>({t('players.me')})</span>}
                    {isPlayerHost && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Crown className="h-3 w-3" />
                        {t('ketal.host')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ready indicator */}
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              </div>
            )
          })}

          {/* Waiting for more players placeholder */}
          {players.length < minPlayers && (
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-muted-foreground/30">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              </div>
              <p className="text-muted-foreground">
                {t('ketal.waiting_for_more_players')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Start button */}
      {isHost ? (
        <Button
          onClick={onStartGame}
          disabled={!canStart}
          size="lg"
          className="w-full h-14 text-lg gap-2"
        >
          <Play className="h-5 w-5" />
          {canStart ? t('ketal.start_game') : t('ketal.need_more_players')}
        </Button>
      ) : (
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">
            {t('ketal.host_starts_game')}
          </p>
        </div>
      )}
    </div>
  )
}
