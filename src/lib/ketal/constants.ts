// Constants for the Ketal card game

import type { PyramidStep } from './types'

// Minimum players required to start a game
export const MIN_PLAYERS = 2

// Maximum players per deck of 52 cards
export const MAX_PLAYERS_PER_DECK = 10

// Cards per player in Phase 1
export const CARDS_PER_PLAYER = 4

// Cards in pyramid
export const PYRAMID_CARDS = 12

// Pyramid sequence: 12 steps with increasing sips, alternating drink/give
export const PYRAMID_SEQUENCE: Array<{ amount: number; direction: 'drink' | 'give' }> = [
  { amount: 1, direction: 'drink' },
  { amount: 1, direction: 'give' },
  { amount: 2, direction: 'drink' },
  { amount: 2, direction: 'give' },
  { amount: 3, direction: 'drink' },
  { amount: 3, direction: 'give' },
  { amount: 4, direction: 'drink' },
  { amount: 4, direction: 'give' },
  { amount: 5, direction: 'drink' },
  { amount: 5, direction: 'give' },
  { amount: 6, direction: 'drink' },
  { amount: 6, direction: 'give' },
]

// Build a blank pyramid for initial state
export const buildBlankPyramid = (): PyramidStep[] =>
  PYRAMID_SEQUENCE.map((step, index) => ({
    index,
    amount: step.amount,
    direction: step.direction,
    card: undefined,
  }))

// Suit symbols for display
export const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

// Suit colors
export const SUIT_COLORS: Record<string, 'red' | 'black'> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
}

// Rank values for comparison (A = 1, 2-10, J=11, Q=12, K=13)
export const RANK_VALUES: Record<string, number> = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
}

// All ranks in order
export const RANKS: string[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

// All suits
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const
