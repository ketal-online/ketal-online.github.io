import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import type { KetalGameState, DrinkHistoryEntry } from '@/lib/ketal/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/lib/dicebear'
import { Wine, Gift, Trophy, Medal, TrendingUp, TrendingDown, History, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface StatsProps {
  state: KetalGameState
  selfId: string
}

// Stats panel showing drink statistics
export function StatsPanel({ state, selfId }: StatsProps) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const { stats, playerOrder } = state

  // Sort players by total drinks (taken)
  const sortedPlayers = [...playerOrder].sort((a, b) => {
    const aTaken = stats[a.id]?.taken || 0
    const bTaken = stats[b.id]?.taken || 0
    return bTaken - aTaken
  })

  // Get top drinker
  const topDrinker = sortedPlayers[0]
  const topDrinkerSips = stats[topDrinker?.id]?.taken || 0

  // Get top giver
  const topGiver = [...playerOrder].sort((a, b) => {
    const aGiven = stats[a.id]?.given || 0
    const bGiven = stats[b.id]?.given || 0
    return bGiven - aGiven
  })[0]
  const topGiverSips = stats[topGiver?.id]?.given || 0

  // My stats
  const myStats = stats[selfId] || { given: 0, taken: 0 }

  if (playerOrder.length === 0) return null

  return (
    <div className="border-t bg-muted/20">
      {/* Compact summary - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Wine className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">{t('ketal.you_drank')}:</span>
            <span className="font-bold">{myStats.taken}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gift className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">{t('ketal.you_gave')}:</span>
            <span className="font-bold">{myStats.given}</span>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded stats */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Leaderboard highlights */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top drinker */}
            {topDrinker && topDrinkerSips > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <Trophy className="h-5 w-5 text-orange-500" />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(topDrinker.name)} />
                  <AvatarFallback>{topDrinker.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{t('ketal.top_drinker')}</p>
                  <p className="font-medium text-sm truncate">{topDrinker.name}</p>
                </div>
                <span className="font-bold text-orange-600">{topDrinkerSips}</span>
              </div>
            )}

            {/* Top giver */}
            {topGiver && topGiverSips > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                <Medal className="h-5 w-5 text-green-500" />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(topGiver.name)} />
                  <AvatarFallback>{topGiver.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{t('ketal.top_giver')}</p>
                  <p className="font-medium text-sm truncate">{topGiver.name}</p>
                </div>
                <span className="font-bold text-green-600">{topGiverSips}</span>
              </div>
            )}
          </div>

          {/* Full player stats */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('ketal.all_players')}
            </h4>
            <div className="space-y-1">
              {sortedPlayers.map((player, index) => {
                const playerStats = stats[player.id] || { given: 0, taken: 0 }
                const isMe = player.id === selfId

                return (
                  <div
                    key={player.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg',
                      isMe && 'bg-primary/5 ring-1 ring-primary/20'
                    )}
                  >
                    <span className="w-5 text-center text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={getAvatarUrl(player.name)} />
                      <AvatarFallback className="text-xs">{player.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className={cn('flex-1 text-sm truncate', isMe && 'font-medium')}>
                      {player.name}
                    </span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-orange-600">
                        <TrendingDown className="h-3 w-3" />
                        {playerStats.taken}
                      </span>
                      <span className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        {playerStats.given}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// History panel showing recent drink events
interface HistoryPanelProps {
  history: DrinkHistoryEntry[]
  selfId: string
  onClose: () => void
}

export function HistoryPanel({ history, selfId, onClose }: HistoryPanelProps) {
  const { t } = useLanguage()

  // Group by phase
  const phase1Events = history.filter((e) => e.phase === 'phase1')
  const pyramidEvents = history.filter((e) => e.phase === 'pyramid')

  const renderEvent = (event: DrinkHistoryEntry) => {
    const isMe = event.targetId === selfId || event.sourceId === selfId
    const isDrink = event.direction === 'drink'
    const isMyDrink = event.targetId === selfId && isDrink
    const isMyGive = event.sourceId === selfId && event.direction === 'give'

    return (
      <div
        key={event.id}
        className={cn(
          'flex items-start gap-2 p-2 rounded-lg text-sm',
          isMe && 'bg-primary/5'
        )}
      >
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            isDrink ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
          )}
        >
          {isDrink ? <Wine className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          {isDrink ? (
            <p>
              <span className={cn('font-medium', isMyDrink && 'text-primary')}>
                {event.targetName}
              </span>
              <span className="text-muted-foreground"> {t('ketal.drank')} </span>
              <span className="font-bold text-orange-600">{event.amount}</span>
              <span className="text-muted-foreground">
                {' '}
                {event.amount === 1 ? t('ketal.sip') : t('ketal.sips')}
              </span>
            </p>
          ) : (
            <p>
              <span className={cn('font-medium', isMyGive && 'text-primary')}>
                {event.sourceName}
              </span>
              <span className="text-muted-foreground"> → </span>
              <span className={cn('font-medium', event.targetId === selfId && 'text-primary')}>
                {event.targetName}
              </span>
              <span className="text-muted-foreground">: </span>
              <span className="font-bold text-green-600">{event.amount}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground truncate">{event.reason}</p>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {new Date(event.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <h3 className="font-semibold text-lg">{t('ketal.history')}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('ketal.no_history')}
            </p>
          ) : (
            <>
              {pyramidEvents.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {t('ketal.phase2')}
                  </h4>
                  <div className="space-y-1">
                    {pyramidEvents.slice().reverse().map(renderEvent)}
                  </div>
                </div>
              )}
              {phase1Events.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {t('ketal.phase1')}
                  </h4>
                  <div className="space-y-1">
                    {phase1Events.slice().reverse().map(renderEvent)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
