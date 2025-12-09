import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import type { KetalGameState } from '@/lib/ketal/types'
import { PlayingCard, CardSlot } from './playing-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/lib/dicebear'
import { Wine, Gift, ChevronRight, Trophy } from 'lucide-react'

interface PyramidProps {
  state: KetalGameState
  selfId: string
  isHost: boolean
  onRevealCard: () => void
}

// Pyramid layout - 12 cards in a pyramid shape
// Row 1: 1 card, Row 2: 2 cards, Row 3: 3 cards, Row 4: 4 cards, Row 5: 2 cards (bonus)
// Actually let's do a simpler linear layout with visual grouping

export function PyramidView({
  state,
  selfId,
  isHost,
  onRevealCard,
}: PyramidProps) {
  const { t } = useLanguage()
  const { pyramid, players, playerOrder } = state
  const currentStep = pyramid.nextStepIndex
  const isComplete = pyramid.completed

  // Group steps by sip count for visual organization
  const stepGroups = [
    { sips: 1, indices: [0, 1] },
    { sips: 2, indices: [2, 3] },
    { sips: 3, indices: [4, 5] },
    { sips: 4, indices: [6, 7] },
    { sips: 5, indices: [8, 9] },
    { sips: 6, indices: [10, 11] },
  ]

  // Count matches for a value in a player's cards
  const countPlayerMatches = (playerId: string, value: number): number => {
    const playerState = players[playerId]
    if (!playerState) return 0
    return Object.values(playerState.cards)
      .filter((card) => card?.value === value)
      .length
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 gap-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">{t('ketal.phase2')}</h2>
        <p className="text-lg text-muted-foreground">
          {isComplete
            ? t('ketal.pyramid_complete')
            : `${t('ketal.step')} ${currentStep + 1}/12`}
        </p>
      </div>

      {/* Pyramid visualization */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-4">
          {stepGroups.map(({ sips, indices }) => (
            <div key={sips} className="space-y-2">
              {/* Sip level header */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Wine className="h-4 w-4" />
                  <span>{sips} {sips === 1 ? t('ketal.sip') : t('ketal.sips')}</span>
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Cards in this level */}
              <div className="flex gap-4 justify-center">
                {indices.map((stepIndex) => {
                  const step = pyramid.steps[stepIndex]
                  const isNext = stepIndex === currentStep
                  const isRevealed = step?.card !== undefined
                  const isPast = stepIndex < currentStep

                  return (
                    <div
                      key={stepIndex}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
                        isNext && 'bg-primary/10 ring-2 ring-primary',
                        isPast && 'opacity-60'
                      )}
                    >
                      {/* Direction badge */}
                      <div
                        className={cn(
                          'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          step?.direction === 'drink'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        )}
                      >
                        {step?.direction === 'drink' ? (
                          <>
                            <Wine className="h-3 w-3" />
                            {t('ketal.drink')}
                          </>
                        ) : (
                          <>
                            <Gift className="h-3 w-3" />
                            {t('ketal.give')}
                          </>
                        )}
                      </div>

                      {/* Card */}
                      {isRevealed && step.card ? (
                        <PlayingCard card={step.card} size="md" />
                      ) : (
                        <CardSlot
                          size="md"
                          label={isNext ? '?' : `#${stepIndex + 1}`}
                          highlighted={isNext}
                          onClick={isHost && isNext ? onRevealCard : undefined}
                        />
                      )}

                      {/* Affected players */}
                      {isRevealed && step.card && (
                        <div className="flex -space-x-2">
                          {playerOrder
                            .filter((p) => countPlayerMatches(p.id, step.card!.value) > 0)
                            .map((p) => {
                              const matches = countPlayerMatches(p.id, step.card!.value)
                              return (
                                <div key={p.id} className="relative" title={`${p.name}: ${matches}`}>
                                  <Avatar className="h-6 w-6 border-2 border-background">
                                    <AvatarImage src={getAvatarUrl(p.name)} />
                                    <AvatarFallback className="text-xs">
                                      {p.name.slice(0, 1)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {matches > 1 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                      {matches}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action button */}
      {!isComplete && isHost && (
        <Button
          onClick={onRevealCard}
          className="w-full h-12 text-lg gap-2"
        >
          <ChevronRight className="h-5 w-5" />
          {t('ketal.reveal_next_card')}
        </Button>
      )}

      {isComplete && (
        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-green-600">
          <Trophy className="h-6 w-6" />
          {t('ketal.game_complete')}
        </div>
      )}

      {/* Players and their cards (compact view) */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
          {t('ketal.player_cards')}
        </h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {playerOrder.map((player) => {
            const playerState = players[player.id]
            const cards = playerState
              ? Object.values(playerState.cards).filter(Boolean)
              : []

            return (
              <div
                key={player.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg bg-muted/30',
                  player.id === selfId && 'ring-1 ring-primary'
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(player.name)} />
                  <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex gap-0.5">
                  {cards.map((card) => (
                    <PlayingCard key={card!.id} card={card!} size="xs" />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
