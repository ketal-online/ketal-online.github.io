import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Peer } from '@/hooks/use-game-room'
import { useLanguage } from '@/lib/language-context'
import { supabase } from '@/lib/supabase'
import { buildBlankPyramid } from '@/lib/ketal/constants'
import { buildEmptyPlayerState, createDeck, createInitialState, evaluatePhase1, getDeckCount } from '@/lib/ketal/engine'
import type {
  DrinkHistoryEntry,
  DrinkTask,
  DrinkDirection,
  KetalCard,
  KetalCommand,
  KetalGameState,
  KetalSyncPayload,
  Phase1Turn,
  PlayerMeta,
  PredictionValue,
  RequestStateCommand,
} from '@/lib/ketal/types'

const MIN_PLAYERS = 2

const deepClone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value)) as T
}

const ensurePlayerStats = (draft: KetalGameState, playerId: string) => {
  if (!draft.stats[playerId]) {
    draft.stats[playerId] = { given: 0, taken: 0 }
  }
}

const buildHistoryEntry = (
  draft: KetalGameState,
  params: {
    sourceId: string
    targetId: string
    amount: number
    direction: DrinkDirection
    reason: string
    phase: 'phase1' | 'pyramid'
  }
): DrinkHistoryEntry => {
  const sourceMeta = draft.playerOrder.find((player) => player.id === params.sourceId)
  const targetMeta = draft.playerOrder.find((player) => player.id === params.targetId)

  return {
    id: crypto.randomUUID(),
    sessionId: draft.sessionId,
    sourceId: params.sourceId,
    sourceName: sourceMeta?.name ?? 'Player',
    sourceUserId: sourceMeta?.userId ?? null,
    targetId: params.targetId,
    targetName: targetMeta?.name ?? 'Player',
    targetUserId: targetMeta?.userId ?? null,
    direction: params.direction,
    amount: params.amount,
    reason: params.reason,
    phase: params.phase,
    createdAt: Date.now(),
  }
}

const pushHistoryEntry = (draft: KetalGameState, entry: DrinkHistoryEntry) => {
  draft.history.push(entry)
  ensurePlayerStats(draft, entry.targetId)
  ensurePlayerStats(draft, entry.sourceId)
  draft.stats[entry.targetId].taken += entry.amount
  if (entry.direction === 'give' && entry.sourceId !== entry.targetId) {
    draft.stats[entry.sourceId].given += entry.amount
  }
}

const createGiveTask = (
  draft: KetalGameState,
  sourceId: string,
  amount: number,
  phase: 'phase1' | 'pyramid',
  reason: string,
  meta?: { turn?: Phase1Turn; pyramidStep?: number }
): DrinkTask => ({
  id: crypto.randomUUID(),
  sessionId: draft.sessionId,
  sourceId,
  amount,
  direction: 'give',
  remaining: amount,
  reason,
  createdAt: Date.now(),
  allocations: [],
  phase,
  meta,
})

const countMatches = (playerState: ReturnType<typeof buildEmptyPlayerState>, value: number) => {
  return (Object.values(playerState.cards) as (KetalCard | undefined)[])
    .filter((card): card is KetalCard => Boolean(card))
    .filter((card) => card.value === value)
    .length
}

const advancePhase1 = (draft: KetalGameState) => {
  const playersCount = draft.playerOrder.length
  if (playersCount === 0) return

  if (draft.phase1.currentPlayerIndex < playersCount - 1) {
    draft.phase1.currentPlayerIndex += 1
    return
  }

  if (draft.phase1.currentRound < 4) {
    draft.phase1.currentPlayerIndex = 0
    draft.phase1.currentRound = (draft.phase1.currentRound + 1) as Phase1Turn
    return
  }

  draft.phase1.currentPlayerIndex = 0
  draft.phase1.currentRound = 4
  draft.phase1.completed = true
  draft.phase = 'phase2'
}

type ActionTuple<T> = [
  (payload: T, target?: string | string[]) => void,
  (handler: (payload: T, peerId: string) => void) => void,
  unknown?
]

interface UseKetalGameArgs {
  roomId?: string
  peers: Peer[]
  selfId: string
  displayName: string
  userId?: string
  createAction?: <T>(key: string) => ActionTuple<T> | null
  connected: boolean
}

export function useKetalGame({
  roomId,
  peers,
  selfId,
  displayName,
  userId,
  createAction,
  connected,
}: UseKetalGameArgs) {
  const { t } = useLanguage()
  const [state, setState] = useState<KetalGameState>(() => createInitialState())
  const [commandReady, setCommandReady] = useState(false)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const isHostRef = useRef(false)
  const hostIdRef = useRef<string>('')
  const persistenceQueue = useRef<DrinkHistoryEntry[]>([])
  const stateChannelRef = useRef<ActionTuple<KetalSyncPayload> | null>(null)
  const commandChannelRef = useRef<ActionTuple<KetalCommand> | null>(null)
  const knownPeerIdsRef = useRef<string[]>([])

  const lobbyPlayers = useMemo<PlayerMeta[]>(() => {
    const others = peers.map((peer) => ({ id: peer.id, name: peer.name, userId: peer.userId }))
    return [{ id: selfId, name: displayName, userId }, ...others]
  }, [peers, selfId, displayName, userId])

  const hostId = useMemo(() => {
    if (lobbyPlayers.length === 0) return selfId
    return [...lobbyPlayers].map((player) => player.id).sort()[0]
  }, [lobbyPlayers, selfId])

  const isHost = hostId === selfId
  isHostRef.current = isHost
  hostIdRef.current = hostId

  const persistHistoryEntry = useCallback(async (entry: DrinkHistoryEntry) => {
    if (!roomId) return
    if (!entry.sourceUserId && !entry.targetUserId) return

    try {
      await supabase.from('drink_history').insert({
        room_id: roomId,
        session_id: entry.sessionId,
        source_trystero_id: entry.sourceId,
        source_user_id: entry.sourceUserId,
        source_name: entry.sourceName,
        target_trystero_id: entry.targetId,
        target_user_id: entry.targetUserId,
        target_name: entry.targetName,
        amount: entry.amount,
        direction: entry.direction,
        phase: entry.phase,
        reason: entry.reason,
      })
    } catch (error) {
      console.error('Failed to persist drink history', error)
    }
  }, [roomId])

  const flushPendingEntries = useCallback(() => {
    if (persistenceQueue.current.length === 0) return
    const entries = persistenceQueue.current.splice(0)
    entries.forEach((entry) => persistHistoryEntry(entry))
  }, [persistHistoryEntry])

  const broadcastState = useCallback((target?: string | string[]) => {
    if (!isHostRef.current) return
    const channel = stateChannelRef.current
    if (!channel) return
    const payload: KetalSyncPayload = {
      revision: stateRef.current.revision,
      state: stateRef.current,
    }
    channel[0](payload, target)
  }, [])

  const mutateState = useCallback(
    (mutator: (draft: KetalGameState, registerEntry: (entry: DrinkHistoryEntry) => void) => void) => {
      if (!isHostRef.current) return
      setState((prev) => {
        const draft = deepClone(prev)
        mutator(draft, (entry) => persistenceQueue.current.push(entry))
        draft.revision = prev.revision + 1
        stateRef.current = draft
        return draft
      })
      queueMicrotask(() => {
        broadcastState()
        flushPendingEntries()
      })
    },
    [broadcastState, flushPendingEntries]
  )

  const applyAssignment = useCallback(
    (taskId: string, targetPlayerId: string, amount: number) => {
      if (!isHostRef.current) return
      mutateState((draft, registerEntry) => {
        const taskIndex = draft.tasks.findIndex((task) => task.id === taskId)
        if (taskIndex === -1) return
        const task = draft.tasks[taskIndex]
        if (task.sessionId !== draft.sessionId) return
        const actual = Math.min(amount, task.remaining)
        if (actual <= 0) return

        task.remaining -= actual
        task.allocations.push({
          id: crypto.randomUUID(),
          targetId: targetPlayerId,
          amount: actual,
          createdAt: Date.now(),
        })

        const entry = buildHistoryEntry(draft, {
          sourceId: task.sourceId,
          targetId: targetPlayerId,
          amount: actual,
          direction: 'give',
          reason: task.reason,
          phase: task.phase,
        })
        pushHistoryEntry(draft, entry)
        registerEntry(entry)

        if (task.remaining === 0) {
          draft.tasks.splice(taskIndex, 1)
        }
      })
    },
    [mutateState]
  )

  const handleCommand = useCallback(
    (command: KetalCommand, peerId: string) => {
      if (!isHostRef.current) return

      if (command.type === 'set_prediction') {
        if (command.sessionId !== stateRef.current.sessionId) return
        mutateState((draft) => {
          if (draft.phase !== 'phase1') return
          const currentPlayer = draft.playerOrder[draft.phase1.currentPlayerIndex]
          if (!currentPlayer || currentPlayer.id !== command.playerId) return
          if (command.turn !== draft.phase1.currentRound) return
          const playerState = draft.players[command.playerId]
          if (!playerState || playerState.cards[command.turn]) return
          playerState.predictions[command.turn] = command.choice
        })
        return
      }

      if (command.type === 'assign_sips') {
        if (command.sessionId !== stateRef.current.sessionId) return
        applyAssignment(command.taskId, command.targetPlayerId, command.amount)
        return
      }

      if (command.type === 'request_state') {
        broadcastState(peerId)
      }
    },
    [applyAssignment, broadcastState, mutateState]
  )

  useEffect(() => {
    if (!connected || !createAction) return

    if (!stateChannelRef.current) {
      const channel = createAction<KetalSyncPayload>('k-state')
      if (channel) {
        const [, onState] = channel
        onState((payload) => {
          if (isHostRef.current) return
          stateRef.current = payload.state
          setState(payload.state)
        })
        stateChannelRef.current = channel
      }
    }

    if (!commandChannelRef.current) {
      const channel = createAction<KetalCommand>('k-cmd')
      if (channel) {
        const [, onCommand] = channel
        onCommand((cmd, peerId) => {
          handleCommand(cmd, peerId)
        })
        commandChannelRef.current = channel
        setCommandReady(true)
      }
    }
  }, [connected, createAction, handleCommand])

  useEffect(() => {
    if (isHost || !commandReady) return
    const request: RequestStateCommand = { type: 'request_state', requesterId: selfId }
    commandChannelRef.current?.[0](request, hostIdRef.current)
  }, [commandReady, isHost, selfId])

  useEffect(() => {
    if (!isHost) return
    const current = peers.map((peer) => peer.id)
    const known = knownPeerIdsRef.current
    const newcomers = current.filter((peerId) => !known.includes(peerId))
    knownPeerIdsRef.current = current
    newcomers.forEach((peerId) => broadcastState(peerId))
  }, [broadcastState, isHost, peers])

  useEffect(() => {
    if (!isHost || state.playerOrder.length === 0) return
    const liveMap = new Map(lobbyPlayers.map((player) => [player.id, player]))
    let needsUpdate = false
    const updated = state.playerOrder.map((player) => {
      const live = liveMap.get(player.id)
      if (live && (live.name !== player.name || live.userId !== player.userId)) {
        needsUpdate = true
        return { ...player, name: live.name, userId: live.userId }
      }
      return player
    })

    if (needsUpdate) {
      mutateState((draft) => {
        draft.playerOrder = updated
      })
    }
  }, [isHost, lobbyPlayers, mutateState, state.playerOrder])

  const startPhaseOne = useCallback(() => {
    if (!isHost) return
    if (lobbyPlayers.length < MIN_PLAYERS) {
      toast.warning(t('ketal.errors.not_enough_players'))
      return
    }

    mutateState((draft) => {
      const order = lobbyPlayers.map((player) => ({ ...player }))
      draft.sessionId = crypto.randomUUID()
      draft.phase = 'phase1'
      draft.playerOrder = order
      draft.deck = createDeck(order.length)
      draft.discard = []
      draft.players = order.reduce<Record<string, ReturnType<typeof buildEmptyPlayerState>>>((acc, player) => {
        acc[player.id] = buildEmptyPlayerState()
        return acc
      }, {})
      draft.phase1 = { currentRound: 1, currentPlayerIndex: 0, completed: false }
      draft.pyramid = { steps: buildBlankPyramid(), nextStepIndex: 0, completed: false }
      draft.tasks = []
      draft.history = []
      draft.stats = order.reduce<Record<string, { given: number; taken: number }>>((acc, player) => {
        acc[player.id] = { given: 0, taken: 0 }
        return acc
      }, {})
    })
  }, [isHost, lobbyPlayers, mutateState, t])

  const submitPrediction = useCallback(
    (turn: Phase1Turn, choice: PredictionValue) => {
      const sessionId = stateRef.current.sessionId
      if (!sessionId) return

      if (!isHostRef.current && commandChannelRef.current) {
        commandChannelRef.current[0](
          {
            type: 'set_prediction',
            playerId: selfId,
            turn,
            choice,
            sessionId,
          },
          hostIdRef.current
        )
        return
      }

      if (isHostRef.current) {
        mutateState((draft) => {
          if (draft.phase !== 'phase1') return
          const currentPlayer = draft.playerOrder[draft.phase1.currentPlayerIndex]
          if (!currentPlayer || currentPlayer.id !== selfId) return
          if (draft.phase1.currentRound !== turn) return
          const playerState = draft.players[selfId]
          if (playerState.cards[turn]) return
          playerState.predictions[turn] = choice
        })
      }
    },
    [mutateState, selfId]
  )

  const dealCard = useCallback(() => {
    if (!isHostRef.current) return
    if (stateRef.current.deck.length === 0) {
      toast.error(t('ketal.errors.empty_deck'))
      return
    }

    mutateState((draft, registerEntry) => {
      if (draft.phase !== 'phase1') return
      const currentPlayer = draft.playerOrder[draft.phase1.currentPlayerIndex]
      if (!currentPlayer) return
      const playerState = draft.players[currentPlayer.id]
      const card = draft.deck.shift()
      if (!card) return
      playerState.cards[draft.phase1.currentRound] = card
      draft.discard.push(card)

      const previousCards = ([1, 2, 3] as Phase1Turn[])
        .filter((turn) => turn < draft.phase1.currentRound)
        .map((turn) => playerState.cards[turn])
        .filter((c): c is KetalCard => Boolean(c))

      const resolution = evaluatePhase1({
        turn: draft.phase1.currentRound,
        newCard: card,
        previousCards,
        prediction: playerState.predictions[draft.phase1.currentRound],
      })

      if (resolution.outcome === 'duplicate') {
        playerState.duplicates[draft.phase1.currentRound] = true
        const entry = buildHistoryEntry(draft, {
          sourceId: currentPlayer.id,
          targetId: currentPlayer.id,
          amount: resolution.sips,
          direction: 'drink',
          reason: t('ketal.reasons.duplicate').replace('{turn}', String(draft.phase1.currentRound)),
          phase: 'phase1',
        })
        pushHistoryEntry(draft, entry)
        registerEntry(entry)
      } else if (resolution.direction === 'drink') {
        const entry = buildHistoryEntry(draft, {
          sourceId: currentPlayer.id,
          targetId: currentPlayer.id,
          amount: resolution.sips,
          direction: 'drink',
          reason: t('ketal.reasons.missed').replace('{turn}', String(draft.phase1.currentRound)),
          phase: 'phase1',
        })
        pushHistoryEntry(draft, entry)
        registerEntry(entry)
      } else {
        draft.tasks.push(
          createGiveTask(
            draft,
            currentPlayer.id,
            resolution.sips,
            'phase1',
            t('ketal.reasons.correct').replace('{turn}', String(draft.phase1.currentRound)),
            { turn: draft.phase1.currentRound }
          )
        )
      }

      advancePhase1(draft)
    })
  }, [mutateState, t])

  const revealNextPyramidCard = useCallback(() => {
    if (!isHostRef.current) return
    if (stateRef.current.phase !== 'phase2') {
      toast.info(t('ketal.errors.pyramid_not_ready'))
      return
    }
    if (stateRef.current.deck.length === 0) {
      toast.error(t('ketal.errors.empty_deck'))
      return
    }

    mutateState((draft, registerEntry) => {
      if (draft.phase !== 'phase2') return
      const step = draft.pyramid.steps[draft.pyramid.nextStepIndex]
      if (!step) return
      const card = draft.deck.shift()
      if (!card) return
      step.card = card
      draft.discard.push(card)

      Object.entries(draft.players).forEach(([playerId, playerState]) => {
        const matches = countMatches(playerState, card.value)
        if (!matches) return
        const amount = matches * step.amount
        if (step.direction === 'drink') {
          const entry = buildHistoryEntry(draft, {
            sourceId: playerId,
            targetId: playerId,
            amount,
            direction: 'drink',
            reason: t('ketal.reasons.pyramid_drink').replace('{value}', card.rank).replace('{amount}', String(amount)),
            phase: 'pyramid',
          })
          pushHistoryEntry(draft, entry)
          registerEntry(entry)
        } else {
          draft.tasks.push(
            createGiveTask(
              draft,
              playerId,
              amount,
              'pyramid',
              t('ketal.reasons.pyramid_give').replace('{value}', card.rank).replace('{amount}', String(amount)),
              { pyramidStep: draft.pyramid.nextStepIndex }
            )
          )
        }
      })

      draft.pyramid.nextStepIndex += 1
      if (draft.pyramid.nextStepIndex >= draft.pyramid.steps.length) {
        draft.pyramid.completed = true
        draft.phase = 'complete'
      }
    })
  }, [mutateState, t])

  const assignSips = useCallback(
    (taskId: string, targetPlayerId: string, amount: number) => {
      const sessionId = stateRef.current.sessionId
      if (!sessionId) return

      if (!isHostRef.current && commandChannelRef.current) {
        commandChannelRef.current[0](
          {
            type: 'assign_sips',
            taskId,
            targetPlayerId,
            amount,
            requestedBy: selfId,
            sessionId,
          },
          hostIdRef.current
        )
        return
      }

      applyAssignment(taskId, targetPlayerId, amount)
    },
    [applyAssignment, selfId]
  )

  const resetGame = useCallback(() => {
    if (!isHostRef.current) return
    mutateState((draft) => {
      const fresh = createInitialState()
      Object.assign(draft, fresh)
    })
  }, [mutateState])

  const deckSupportCount = useMemo(() => {
    const playingCount = state.playerOrder.length || lobbyPlayers.length
    return getDeckCount(playingCount)
  }, [lobbyPlayers.length, state.playerOrder.length])

  return {
    state,
    isHost,
    hostId,
    lobbyPlayers,
    startPhaseOne,
    submitPrediction,
    dealCard,
    revealNextPyramidCard,
    assignSips,
    resetGame,
    deckSupportCount,
  }
}
