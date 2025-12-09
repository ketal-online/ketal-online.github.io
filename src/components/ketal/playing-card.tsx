import { cn } from '@/lib/utils'
import type { KetalCard, Suit } from '@/lib/ketal/types'

interface PlayingCardProps {
  card?: KetalCard
  faceDown?: boolean
  selected?: boolean
  highlighted?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

// Suit SVG paths
const SuitPath = {
  hearts: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  diamonds: 'M12 2l6 10-6 10-6-10z',
  clubs: 'M12 2c-2.21 0-4 1.79-4 4 0 1.35.67 2.54 1.69 3.26-.18.36-.32.74-.45 1.14-.44-.25-.96-.4-1.51-.4C5.46 10 4 11.46 4 13.5c0 2.04 1.46 3.5 3.73 3.5 1.65 0 2.97-.95 3.56-2.28.18.02.37.03.56.03h.3c.59 1.33 1.91 2.25 3.56 2.25 2.27 0 3.73-1.46 3.73-3.5 0-2.04-1.46-3.5-3.73-3.5-.55 0-1.07.15-1.51.4-.13-.4-.27-.78-.45-1.14C14.67 8.54 15.33 7.35 15.33 6c0-2.21-1.79-4-4-4H12zM11 16v4h2v-4h-2z',
  spades: 'M12 2L4 12c0 2.21 1.79 4 4 4 1.1 0 2.1-.45 2.82-1.18-.15.85-.62 1.68-1.32 2.18H14.5c-.7-.5-1.17-1.33-1.32-2.18C13.9 15.55 14.9 16 16 16c2.21 0 4-1.79 4-4L12 2zm-1 14h2v4h-2v-4z',
}

// Simple suit icon component
const SuitIcon = ({ suit, className }: { suit: Suit; className?: string }) => {
  const color = suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'
  return (
    <svg viewBox="0 0 24 24" className={cn('fill-current', color, className)}>
      <path d={SuitPath[suit]} />
    </svg>
  )
}

// Size configurations
const sizeConfig = {
  xs: { width: 40, height: 56, fontSize: 'text-xs', iconSize: 'w-2 h-2', cornerSize: 'w-3 h-4' },
  sm: { width: 56, height: 80, fontSize: 'text-sm', iconSize: 'w-3 h-3', cornerSize: 'w-4 h-5' },
  md: { width: 80, height: 112, fontSize: 'text-base', iconSize: 'w-4 h-4', cornerSize: 'w-5 h-6' },
  lg: { width: 100, height: 140, fontSize: 'text-lg', iconSize: 'w-5 h-5', cornerSize: 'w-6 h-8' },
}

export function PlayingCard({
  card,
  faceDown = false,
  selected = false,
  highlighted = false,
  size = 'md',
  onClick,
  className,
}: PlayingCardProps) {
  const config = sizeConfig[size]
  const isClickable = Boolean(onClick)

  // Face down card
  if (faceDown || !card) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'relative rounded-lg border-2 shadow-md transition-all duration-200',
          'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800',
          'border-blue-500/50',
          isClickable && 'cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95',
          selected && 'ring-2 ring-primary ring-offset-2',
          highlighted && 'ring-2 ring-yellow-400 ring-offset-2 animate-pulse',
          className
        )}
        style={{ width: config.width, height: config.height }}
      >
        {/* Pattern on back */}
        <div className="absolute inset-2 rounded border border-blue-400/30">
          <div className="w-full h-full opacity-20" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              rgba(255,255,255,0.1) 4px,
              rgba(255,255,255,0.1) 8px
            )`
          }} />
        </div>
      </div>
    )
  }

  const isRed = card.color === 'red'
  const textColor = isRed ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-lg border-2 shadow-md transition-all duration-200',
        'bg-white dark:bg-slate-50',
        'border-slate-200 dark:border-slate-300',
        isClickable && 'cursor-pointer hover:scale-105 hover:shadow-lg active:scale-95',
        selected && 'ring-2 ring-primary ring-offset-2 scale-105',
        highlighted && 'ring-2 ring-yellow-400 ring-offset-2 animate-pulse',
        className
      )}
      style={{ width: config.width, height: config.height }}
    >
      {/* Top left corner */}
      <div className={cn('absolute top-1 left-1 flex flex-col items-center', config.cornerSize)}>
        <span className={cn('font-bold leading-none', config.fontSize, textColor)}>
          {card.rank}
        </span>
        <SuitIcon suit={card.suit} className={config.iconSize} />
      </div>

      {/* Center suit */}
      <div className="absolute inset-0 flex items-center justify-center">
        <SuitIcon suit={card.suit} className={cn(
          size === 'xs' ? 'w-4 h-4' :
          size === 'sm' ? 'w-6 h-6' :
          size === 'md' ? 'w-8 h-8' :
          'w-10 h-10'
        )} />
      </div>

      {/* Bottom right corner (rotated) */}
      <div className={cn('absolute bottom-1 right-1 flex flex-col items-center rotate-180', config.cornerSize)}>
        <span className={cn('font-bold leading-none', config.fontSize, textColor)}>
          {card.rank}
        </span>
        <SuitIcon suit={card.suit} className={config.iconSize} />
      </div>
    </div>
  )
}

// Empty card slot placeholder
export function CardSlot({
  size = 'md',
  label,
  onClick,
  highlighted = false,
  className,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  label?: string
  onClick?: () => void
  highlighted?: boolean
  className?: string
}) {
  const config = sizeConfig[size]
  const isClickable = Boolean(onClick)

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-all duration-200',
        'border-slate-300 dark:border-slate-600',
        'bg-slate-100/50 dark:bg-slate-800/50',
        'flex items-center justify-center',
        isClickable && 'cursor-pointer hover:border-primary hover:bg-slate-200/50 dark:hover:bg-slate-700/50',
        highlighted && 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
        className
      )}
      style={{ width: config.width, height: config.height }}
    >
      {label && (
        <span className={cn('text-muted-foreground text-center px-1', config.fontSize === 'text-lg' ? 'text-sm' : 'text-xs')}>
          {label}
        </span>
      )}
    </div>
  )
}

// Deck component (stack of cards)
export function CardDeck({
  count,
  size = 'md',
  onClick,
  className,
}: {
  count: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}) {
  const config = sizeConfig[size]
  const stackOffset = size === 'xs' ? 1 : size === 'sm' ? 1.5 : 2
  const visibleCards = Math.min(count, 4)

  return (
    <div
      onClick={onClick}
      className={cn('relative', onClick && 'cursor-pointer', className)}
      style={{ 
        width: config.width + stackOffset * (visibleCards - 1), 
        height: config.height + stackOffset * (visibleCards - 1) 
      }}
    >
      {Array.from({ length: visibleCards }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{ top: i * stackOffset, left: i * stackOffset }}
        >
          <PlayingCard size={size} faceDown />
        </div>
      ))}
      {/* Card count badge */}
      {count > 0 && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
          {count}
        </div>
      )}
    </div>
  )
}
