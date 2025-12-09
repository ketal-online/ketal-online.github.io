// Game engine logic for Ketal

import type {
  KetalCard,
  KetalGameState,
  Phase1Turn,
  PlayerGameState,
  PredictionValue,
  Rank,
  Suit,
} from './types'
import { buildBlankPyramid, CARDS_PER_PLAYER, PYRAMID_CARDS, RANKS, SUIT_COLORS, SUITS } from './constants'

// Calculate how many decks are needed for a given player count
export const getDeckCount = (playerCount: number): number => {
  if (playerCount <= 0) return 1
  const cardsNeeded = playerCount * CARDS_PER_PLAYER + PYRAMID_CARDS
  return Math.ceil(cardsNeeded / 52)
}

// Check if player count is valid for a given number of decks
export const canSupportPlayers = (playerCount: number, deckCount: number = 1): boolean => {
  const cardsAvailable = deckCount * 52
  const cardsNeeded = playerCount * CARDS_PER_PLAYER + PYRAMID_CARDS
  return cardsNeeded <= cardsAvailable
}

// Create a shuffled deck of cards
export const createDeck = (playerCount: number): KetalCard[] => {
  const deckCount = getDeckCount(playerCount)
  const cards: KetalCard[] = []

  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({
          id: crypto.randomUUID(),
          suit: suit as Suit,
          rank: rank as Rank,
          value: RANKS.indexOf(rank) + 1,
          color: SUIT_COLORS[suit],
        })
      }
    }
  }

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }

  return cards
}

// Build an empty player state
export const buildEmptyPlayerState = (): PlayerGameState => ({
  cards: {},
  predictions: {},
  duplicates: {},
})

// Create initial game state
export const createInitialState = (): KetalGameState => ({
  revision: 0,
  sessionId: '',
  phase: 'lobby',
  playerOrder: [],
  deck: [],
  discard: [],
  players: {},
  phase1: {
    currentRound: 1,
    currentPlayerIndex: 0,
    completed: false,
  },
  pyramid: {
    steps: buildBlankPyramid(),
    nextStepIndex: 0,
    completed: false,
  },
  tasks: [],
  history: [],
  stats: {},
})

// Evaluation result for Phase 1
export interface Phase1EvaluationResult {
  outcome: 'correct' | 'incorrect' | 'duplicate'
  direction: 'drink' | 'give'
  sips: number
}

// Evaluate a Phase 1 prediction
export const evaluatePhase1 = (params: {
  turn: Phase1Turn
  newCard: KetalCard
  previousCards: KetalCard[]
  prediction?: PredictionValue
}): Phase1EvaluationResult => {
  const { turn, newCard, previousCards, prediction } = params
  const baseSips = turn

  // Check for duplicates (tours 2 and 3 only)
  if (turn === 2 || turn === 3) {
    const hasDuplicate = previousCards.some((card) => card.value === newCard.value)
    if (hasDuplicate) {
      return {
        outcome: 'duplicate',
        direction: 'drink',
        sips: baseSips * 2,
      }
    }
  }

  // No prediction made = automatic loss
  if (!prediction) {
    return {
      outcome: 'incorrect',
      direction: 'drink',
      sips: baseSips,
    }
  }

  let isCorrect = false

  switch (turn) {
    case 1: {
      // Red or Black
      isCorrect = prediction === newCard.color
      break
    }
    case 2: {
      // Higher or Lower than first card
      const firstCard = previousCards[0]
      if (!firstCard) {
        isCorrect = false
      } else if (prediction === 'higher') {
        isCorrect = newCard.value > firstCard.value
      } else if (prediction === 'lower') {
        isCorrect = newCard.value < firstCard.value
      }
      break
    }
    case 3: {
      // Inside or Outside the range of first two cards
      if (previousCards.length < 2) {
        isCorrect = false
      } else {
        const values = previousCards.map((c) => c.value).sort((a, b) => a - b)
        const min = values[0]
        const max = values[values.length - 1]
        if (prediction === 'inside') {
          isCorrect = newCard.value > min && newCard.value < max
        } else if (prediction === 'outside') {
          isCorrect = newCard.value < min || newCard.value > max
        }
      }
      break
    }
    case 4: {
      // Exact suit
      isCorrect = prediction === newCard.suit
      break
    }
  }

  return {
    outcome: isCorrect ? 'correct' : 'incorrect',
    direction: isCorrect ? 'give' : 'drink',
    sips: baseSips,
  }
}

// Get card display text
export const getCardDisplayText = (card: KetalCard): string => {
  const suitSymbol = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  }[card.suit]
  return `${card.rank}${suitSymbol}`
}
