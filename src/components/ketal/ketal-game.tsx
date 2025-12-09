import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import type { KetalGameState, Phase1Turn, PredictionValue, PlayerMeta } from '@/lib/ketal/types'
import { LobbyView } from './lobby-view'
import { Phase1View } from './phase1-view'
import { PyramidView } from './pyramid-view'
import { SipTaskBar, DrinkNotification } from './sip-assignment'
import { StatsPanel, HistoryPanel } from './stats-panel'
import { Button } from '@/components/ui/button'
import { History, RotateCcw } from 'lucide-react'

interface KetalGameProps {
  state: KetalGameState
  selfId: string
  isHost: boolean
  hostId: string
  lobbyPlayers: PlayerMeta[]
  deckSupportCount: number
  onStartGame: () => void
  onSubmitPrediction: (turn: Phase1Turn, choice: PredictionValue) => void
  onDealCard: () => void
  onRevealPyramidCard: () => void
  onAssignSips: (taskId: string, targetId: string, amount: number) => void
  onResetGame: () => void
}

const MIN_PLAYERS = 2

export function KetalGame({
  state,
  selfId,
  isHost,
  hostId,
  lobbyPlayers,
  deckSupportCount,
  onStartGame,
  onSubmitPrediction,
  onDealCard,
  onRevealPyramidCard,
  onAssignSips,
  onResetGame,
}: KetalGameProps) {
  const { t } = useLanguage()
  const [showHistory, setShowHistory] = useState(false)
  const [pendingDrink, setPendingDrink] = useState<{ sips: number; reason: string } | null>(null)

  // Track last history entry to show drink notifications
  const [lastHistoryLength, setLastHistoryLength] = useState(0)

  useEffect(() => {
    const currentLength = state.history.length
    if (currentLength > lastHistoryLength) {
      // Check new entries for drinks that affect me
      const newEntries = state.history.slice(lastHistoryLength)
      const myDrinks = newEntries.filter(
        (entry) =>
          entry.targetId === selfId &&
          (entry.direction === 'drink' || (entry.direction === 'give' && entry.sourceId !== selfId))
      )

      if (myDrinks.length > 0) {
        // Sum up all sips I need to drink
        const totalSips = myDrinks.reduce((sum, e) => sum + e.amount, 0)
        const reasons = myDrinks.map((e) => e.reason).join(', ')
        setPendingDrink({ sips: totalSips, reason: reasons })
      }
    }
    setLastHistoryLength(currentLength)
  }, [state.history, lastHistoryLength, selfId])

  const renderContent = () => {
    switch (state.phase) {
      case 'lobby':
        return (
          <LobbyView
            players={lobbyPlayers}
            selfId={selfId}
            hostId={hostId}
            isHost={isHost}
            minPlayers={MIN_PLAYERS}
            deckSupportCount={deckSupportCount}
            onStartGame={onStartGame}
          />
        )

      case 'phase1':
        return (
          <Phase1View
            state={state}
            selfId={selfId}
            isHost={isHost}
            onSubmitPrediction={onSubmitPrediction}
            onDealCard={onDealCard}
          />
        )

      case 'phase2':
        return (
          <PyramidView
            state={state}
            selfId={selfId}
            isHost={isHost}
            onRevealCard={onRevealPyramidCard}
          />
        )

      case 'complete':
        return (
          <div className="flex flex-col h-full max-w-md mx-auto p-6 gap-6">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <h2 className="text-3xl font-bold">{t('ketal.game_over')}</h2>
              <p className="text-muted-foreground">{t('ketal.thanks_for_playing')}</p>
            </div>

            {/* Final stats summary */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowHistory(true)}
              >
                <History className="h-4 w-4" />
                {t('ketal.view_history')}
              </Button>

              {isHost && (
                <Button
                  onClick={onResetGame}
                  className="w-full gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('ketal.play_again')}
                </Button>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Stats panel (always visible during game) */}
      {state.phase !== 'lobby' && (
        <StatsPanel state={state} selfId={selfId} />
      )}

      {/* Sip task bar */}
      {(state.phase === 'phase1' || state.phase === 'phase2') && (
        <SipTaskBar
          tasks={state.tasks}
          players={state.playerOrder}
          selfId={selfId}
          onAssign={onAssignSips}
        />
      )}

      {/* Drink notification overlay */}
      {pendingDrink && (
        <DrinkNotification
          sips={pendingDrink.sips}
          reason={pendingDrink.reason}
          onDismiss={() => setPendingDrink(null)}
        />
      )}

      {/* History modal */}
      {showHistory && (
        <HistoryPanel
          history={state.history}
          selfId={selfId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}
