import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'
import type { DrinkTask, PlayerMeta } from '@/lib/ketal/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/lib/dicebear'
import { Wine, Gift, X, Check, Minus, Plus } from 'lucide-react'

interface SipAssignmentProps {
  task: DrinkTask
  players: PlayerMeta[]
  selfId: string
  onAssign: (taskId: string, targetId: string, amount: number) => void
  onClose: () => void
}

export function SipAssignmentDialog({
  task,
  players,
  selfId,
  onAssign,
  onClose,
}: SipAssignmentProps) {
  const { t } = useLanguage()
  const [allocations, setAllocations] = useState<Record<string, number>>({})

  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + v, 0)
  const remaining = task.remaining - totalAllocated

  const updateAllocation = (playerId: string, delta: number) => {
    setAllocations((prev) => {
      const current = prev[playerId] || 0
      const newValue = Math.max(0, Math.min(current + delta, remaining + current))
      if (newValue === 0) {
        const { [playerId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [playerId]: newValue }
    })
  }

  const confirmAllocations = () => {
    Object.entries(allocations).forEach(([targetId, amount]) => {
      if (amount > 0) {
        onAssign(task.id, targetId, amount)
      }
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-lg">{t('ketal.distribute_sips')}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Info */}
        <div className="p-4 bg-primary/5 border-b">
          <p className="text-center">
            <span className="text-2xl font-bold text-primary">{task.remaining}</span>
            <span className="text-muted-foreground ml-2">
              {task.remaining === 1 ? t('ketal.sip_to_give') : t('ketal.sips_to_give')}
            </span>
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1">
            {task.reason}
          </p>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {players.map((player) => {
            const allocation = allocations[player.id] || 0
            const isMe = player.id === selfId

            return (
              <div
                key={player.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-all',
                  allocation > 0 && 'bg-orange-50 dark:bg-orange-950/30 ring-1 ring-orange-200 dark:ring-orange-800',
                  isMe && 'opacity-70'
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getAvatarUrl(player.name)} />
                  <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {player.name}
                    {isMe && <span className="text-xs text-muted-foreground ml-1">({t('players.me')})</span>}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateAllocation(player.id, -1)}
                    disabled={allocation === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="w-10 text-center">
                    <span className={cn(
                      'text-lg font-bold',
                      allocation > 0 ? 'text-orange-600' : 'text-muted-foreground'
                    )}>
                      {allocation}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateAllocation(player.id, 1)}
                    disabled={remaining <= 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('ketal.remaining')}:</span>
            <span className={cn(
              'font-bold text-lg',
              remaining > 0 ? 'text-primary' : 'text-green-600'
            )}>
              {remaining}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={confirmAllocations}
              disabled={totalAllocated === 0}
            >
              <Check className="h-4 w-4" />
              {t('ketal.confirm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Task bar showing pending sips to distribute
interface TaskBarProps {
  tasks: DrinkTask[]
  players: PlayerMeta[]
  selfId: string
  onAssign: (taskId: string, targetId: string, amount: number) => void
}

export function SipTaskBar({ tasks, players, selfId, onAssign }: TaskBarProps) {
  const { t } = useLanguage()
  const [selectedTask, setSelectedTask] = useState<DrinkTask | null>(null)

  const myTasks = tasks.filter((task) => task.sourceId === selfId && task.remaining > 0)

  if (myTasks.length === 0) return null

  return (
    <>
      {/* Fixed bar at bottom */}
      <div className="fixed bottom-20 left-4 right-4 z-30 flex justify-center pointer-events-none">
        <div className="flex gap-2 flex-wrap justify-center pointer-events-auto">
          {myTasks.map((task) => (
            <Button
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={cn(
                'gap-2 shadow-lg animate-in slide-in-from-bottom-2',
                'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              )}
            >
              <Gift className="h-4 w-4" />
              <span className="font-bold">{task.remaining}</span>
              <span>{t('ketal.to_give')}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Assignment dialog */}
      {selectedTask && (
        <SipAssignmentDialog
          task={selectedTask}
          players={players}
          selfId={selfId}
          onAssign={onAssign}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  )
}

// Drink notification (when you need to drink)
interface DrinkNotificationProps {
  sips: number
  reason: string
  onDismiss: () => void
}

export function DrinkNotification({ sips, reason, onDismiss }: DrinkNotificationProps) {
  const { t } = useLanguage()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onDismiss}>
      <div
        className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-2xl p-8 text-white text-center max-w-sm animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <Wine className="h-16 w-16 mx-auto mb-4 animate-bounce" />
        <h2 className="text-4xl font-bold mb-2">{t('ketal.drink_up')}!</h2>
        <p className="text-6xl font-black mb-2">{sips}</p>
        <p className="text-xl opacity-90">
          {sips === 1 ? t('ketal.sip') : t('ketal.sips')}
        </p>
        <p className="text-sm opacity-75 mt-4">{reason}</p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={onDismiss}
        >
          {t('ketal.understood')}
        </Button>
      </div>
    </div>
  )
}
