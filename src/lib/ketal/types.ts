// Types for the Ketal card game

// Card suits
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

// Card rank (numeric value 1-13)
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

// Card color
export type CardColor = 'red' | 'black'

// A single playing card
export interface KetalCard {
  id: string
  suit: Suit
  rank: Rank
  value: number // 1-13 for sorting (A=1, J=11, Q=12, K=13)
  color: CardColor
}

// Phase 1 turns (1-4)
export type Phase1Turn = 1 | 2 | 3 | 4

// Phase 1 choices for each turn
export type Phase1Choice =
  | { turn: 1; choice: 'red' | 'black' }
  | { turn: 2; choice: 'higher' | 'lower' }
  | { turn: 3; choice: 'inside' | 'outside' }
  | { turn: 4; choice: Suit }

// Simplified prediction type for storage
export type PredictionValue = 'red' | 'black' | 'higher' | 'lower' | 'inside' | 'outside' | Suit

// Player metadata (shared across peers)
export interface PlayerMeta {
  id: string // trystero peer ID
  name: string
  userId?: string // supabase user id (for authenticated users)
}

// Player's state during the game
export interface PlayerGameState {
  cards: {
    1?: KetalCard
    2?: KetalCard
    3?: KetalCard
    4?: KetalCard
  }
  predictions: {
    1?: PredictionValue
    2?: PredictionValue
    3?: PredictionValue
    4?: PredictionValue
  }
  duplicates: {
    1?: boolean
    2?: boolean
    3?: boolean
    4?: boolean
  }
}

// Pyramid step configuration
export interface PyramidStep {
  index: number
  amount: number // 1-6 sips
  direction: 'drink' | 'give'
  card?: KetalCard // revealed card (undefined until revealed)
}

// Game phase
export type GamePhase = 'lobby' | 'phase1' | 'phase2' | 'complete'

// Direction of drink action
export type DrinkDirection = 'drink' | 'give'

// Allocation of sips to a target player
export interface SipAllocation {
  id: string
  targetId: string
  amount: number
  createdAt: number
}

// Task for assigning sips to give
export interface DrinkTask {
  id: string
  sessionId: string
  sourceId: string
  amount: number
  direction: DrinkDirection
  remaining: number
  reason: string
  createdAt: number
  allocations: SipAllocation[]
  phase: 'phase1' | 'pyramid'
  meta?: {
    turn?: Phase1Turn
    pyramidStep?: number
  }
}

// Entry in drink history
export interface DrinkHistoryEntry {
  id: string
  sessionId: string
  sourceId: string
  sourceName: string
  sourceUserId: string | null
  targetId: string
  targetName: string
  targetUserId: string | null
  direction: DrinkDirection
  amount: number
  reason: string
  phase: 'phase1' | 'pyramid'
  createdAt: number
}

// Full game state (synchronized across peers)
export interface KetalGameState {
  revision: number
  sessionId: string
  phase: GamePhase
  playerOrder: PlayerMeta[]
  deck: KetalCard[]
  discard: KetalCard[]
  players: Record<string, PlayerGameState>
  phase1: {
    currentRound: Phase1Turn
    currentPlayerIndex: number
    completed: boolean
  }
  pyramid: {
    steps: PyramidStep[]
    nextStepIndex: number
    completed: boolean
  }
  tasks: DrinkTask[]
  history: DrinkHistoryEntry[]
  stats: Record<string, { given: number; taken: number }>
}

// Sync payload sent over P2P
export interface KetalSyncPayload {
  revision: number
  state: KetalGameState
}

// Commands sent from client to host

export interface SetPredictionCommand {
  type: 'set_prediction'
  playerId: string
  turn: Phase1Turn
  choice: PredictionValue
  sessionId: string
}

export interface AssignSipsCommand {
  type: 'assign_sips'
  taskId: string
  targetPlayerId: string
  amount: number
  requestedBy: string
  sessionId: string
}

export interface RequestStateCommand {
  type: 'request_state'
  requesterId: string
}

export type KetalCommand = SetPredictionCommand | AssignSipsCommand | RequestStateCommand
