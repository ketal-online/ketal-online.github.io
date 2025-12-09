import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import type { Phase1Turn, PredictionValue, Suit, KetalGameState, PlayerMeta } from '@/lib/ketal/types'
import { PlayingCard, CardSlot } from './playing-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/lib/dicebear'
import { Send } from 'lucide-react'

interface Phase1Props {
  state: KetalGameState
  selfId: string
  isHost: boolean
  onSubmitPrediction: (turn: Phase1Turn, choice: PredictionValue) => void
  onDealCard: () => void
}

// Prediction buttons for each turn
const TurnPredictionButtons = ({
  turn,
  onSelect,
  disabled,
  currentPrediction,
}: {
  turn: Phase1Turn
  onSelect: (choice: PredictionValue) => void
  disabled: boolean
  currentPrediction?: PredictionValue
}) => {
  const { t } = useLanguage()

  const buttonBase = 'flex-1 h-12 text-base font-semibold transition-all'
  const selectedClass = 'ring-2 ring-offset-2 ring-primary'

  if (turn === 1) {
    return (
      <div className="flex gap-3">
        <Button
          onClick={() => onSelect('red')}
          disabled={disabled}
          className={cn(
            buttonBase,
            'bg-red-500 hover:bg-red-600 text-white',
            currentPrediction === 'red' && selectedClass
          )}
        >
          {t('ketal.red')} ♥♦
        </Button>
        <Button
          onClick={() => onSelect('black')}
          disabled={disabled}
          className={cn(
            buttonBase,
            'bg-slate-800 hover:bg-slate-900 text-white',
            currentPrediction === 'black' && selectedClass
          )}
        >
          {t('ketal.black')} ♠♣
        </Button>
      </div>
    )
  }

  if (turn === 2) {
    return (
      <div className="flex gap-3">
        <Button
          onClick={() => onSelect('higher')}
          disabled={disabled}
          variant="outline"
          className={cn(
            buttonBase,
            'border-2',
            currentPrediction === 'higher' && selectedClass
          )}
        >
          ↑ {t('ketal.higher')}
        </Button>
        <Button
          onClick={() => onSelect('lower')}
          disabled={disabled}
          variant="outline"
          className={cn(
            buttonBase,
            'border-2',
            currentPrediction === 'lower' && selectedClass
          )}
        >
          ↓ {t('ketal.lower')}
        </Button>
      </div>
    )
  }

  if (turn === 3) {
    return (
      <div className="flex gap-3">
        <Button
          onClick={() => onSelect('inside')}
          disabled={disabled}
          variant="outline"
          className={cn(
            buttonBase,
            'border-2',
            currentPrediction === 'inside' && selectedClass
          )}
        >
          ↔ {t('ketal.inside')}
        </Button>
        <Button
          onClick={() => onSelect('outside')}
          disabled={disabled}
          variant="outline"
          className={cn(
            buttonBase,
            'border-2',
            currentPrediction === 'outside' && selectedClass
          )}
        >
          ⇿ {t('ketal.outside')}
        </Button>
      </div>
    )
  }

  // Turn 4: Suit selection
  const suits: { suit: Suit; symbol: string; color: string }[] = [
    { suit: 'hearts', symbol: '♥', color: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950' },
    { suit: 'diamonds', symbol: '♦', color: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950' },
    { suit: 'clubs', symbol: '♣', color: 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800' },
    { suit: 'spades', symbol: '♠', color: 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800' },
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {suits.map(({ suit, symbol, color }) => (
        <Button
          key={suit}
          onClick={() => onSelect(suit)}
          disabled={disabled}
          variant="outline"
          className={cn(
            'h-12 text-2xl font-bold border-2',
            color,
            currentPrediction === suit && selectedClass
          )}
        >
          {symbol}
        </Button>
      ))}
    </div>
  )
}

// Player row showing their cards
const PlayerCardsRow = ({
  player,
  playerState,
  isCurrentTurn,
  isMe,
  currentRound,
}: {
  player: PlayerMeta
  playerState: KetalGameState['players'][string]
  isCurrentTurn: boolean
  isMe: boolean
  currentRound: Phase1Turn
}) => {
  const { t } = useLanguage()

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all',
        isCurrentTurn && 'bg-primary/10 ring-2 ring-primary',
        isMe && 'bg-muted/50'
      )}
    >
      {/* Player avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={getAvatarUrl(player.name)} />
        <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      {/* Player name */}
      <div className="min-w-0 flex-shrink-0 w-24">
        <p className={cn('font-medium truncate', isMe && 'text-primary')}>
          {player.name}
          {isMe && <span className="text-xs text-muted-foreground ml-1">({t('players.me')})</span>}
        </p>
        {isCurrentTurn && (
          <p className="text-xs text-primary animate-pulse">{t('ketal.your_turn')}</p>
        )}
      </div>

      {/* Cards */}
      <div className="flex gap-1.5 flex-1 justify-center">
        {([1, 2, 3, 4] as Phase1Turn[]).map((turn) => {
          const card = playerState?.cards[turn]
          const hasPrediction = playerState?.predictions[turn] !== undefined
          const isDuplicate = playerState?.duplicates[turn]

          return (
            <div key={turn} className="relative">
              {card ? (
                <PlayingCard
                  card={card}
                  size="sm"
                  highlighted={isDuplicate}
                />
              ) : (
                <CardSlot
                  size="sm"
                  label={turn <= currentRound && hasPrediction ? '?' : `T${turn}`}
                  highlighted={turn === currentRound && isCurrentTurn}
                />
              )}
              {/* Duplicate indicator */}
              {isDuplicate && (
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] px-1 rounded-full font-bold">
                  x2
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Main Phase 1 component
export function Phase1View({
  state,
  selfId,
  isHost,
  onSubmitPrediction,
  onDealCard,
}: Phase1Props) {
  const { t } = useLanguage()
  const currentPlayer = state.playerOrder[state.phase1.currentPlayerIndex]
  const isMyTurn = currentPlayer?.id === selfId
  const myPlayerState = state.players[selfId]
  const currentRound = state.phase1.currentRound
  const myPrediction = myPlayerState?.predictions[currentRound]
  const myCard = myPlayerState?.cards[currentRound]

  const turnTitles: Record<Phase1Turn, string> = {
    1: t('ketal.turn1_title'),
    2: t('ketal.turn2_title'),
    3: t('ketal.turn3_title'),
    4: t('ketal.turn4_title'),
  }

  const handlePrediction = (choice: PredictionValue) => {
    if (!isMyTurn || myCard) return
    onSubmitPrediction(currentRound, choice)
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 gap-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">{t('ketal.phase1')}</h2>
        <p className="text-lg text-muted-foreground">
          {t('ketal.round')} {currentRound}/4 - {turnTitles[currentRound]}
        </p>
      </div>

      {/* Current turn info */}
      {isMyTurn && !myCard && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
          <p className="text-center font-medium">
            {t('ketal.make_prediction')}
          </p>
          <TurnPredictionButtons
            turn={currentRound}
            onSelect={handlePrediction}
            disabled={!!myPrediction && !myCard}
            currentPrediction={myPrediction}
          />
          {myPrediction && !myCard && isHost && (
            <Button
              onClick={onDealCard}
              className="w-full h-12 text-lg gap-2"
            >
              <Send className="h-5 w-5" />
              {t('ketal.deal_card')}
            </Button>
          )}
          {myPrediction && !myCard && !isHost && (
            <p className="text-center text-muted-foreground text-sm">
              {t('ketal.waiting_for_host')}
            </p>
          )}
        </div>
      )}

      {/* Waiting for another player */}
      {!isMyTurn && (
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-muted-foreground">
            {t('ketal.waiting_for_player').replace('{0}', currentPlayer?.name || '...')}
          </p>
          {isHost && !state.players[currentPlayer?.id]?.cards[currentRound] && state.players[currentPlayer?.id]?.predictions[currentRound] && (
            <Button
              onClick={onDealCard}
              className="mt-3 gap-2"
            >
              <Send className="h-4 w-4" />
              {t('ketal.deal_card_for').replace('{0}', currentPlayer?.name || '')}
            </Button>
          )}
        </div>
      )}

      {/* Players list */}
      <div className="flex-1 overflow-auto space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {t('players.title')}
        </h3>
        <div className="space-y-1">
          {state.playerOrder.map((player, index) => (
            <PlayerCardsRow
              key={player.id}
              player={player}
              playerState={state.players[player.id]}
              isCurrentTurn={index === state.phase1.currentPlayerIndex}
              isMe={player.id === selfId}
              currentRound={currentRound}
            />
          ))}
        </div>
      </div>

      {/* Deck info */}
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span>{t('ketal.deck_remaining')}: {state.deck.length}</span>
      </div>
    </div>
  )
}
