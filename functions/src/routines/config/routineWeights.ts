import {
  FOLLICLE_WEIGHTS,
  TOTAL_FOLLICLE_WEIGHT,
  SIMILARITY_THRESHOLDS,
  MIN_SIMILARITY_THRESHOLD,
  EXACT_MATCH_BOOST,
  ENGAGEMENT_SCORE_DEFAULTS,
  MATCH_REASONS_CONFIG,
} from '../../shared/constants'

// Re-export shared constants
export {
  FOLLICLE_WEIGHTS,
  TOTAL_FOLLICLE_WEIGHT,
  SIMILARITY_THRESHOLDS,
  MIN_SIMILARITY_THRESHOLD,
  EXACT_MATCH_BOOST,
  ENGAGEMENT_SCORE_DEFAULTS,
  MATCH_REASONS_CONFIG,
}

/**
 * Master algorithm balance for routines
 */
export const ROUTINE_ALGORITHM_WEIGHTS = {
  product: 0.1, // 10% - Quality of products in the routine
  engagement: 0.9, // 90% - Community validation from similar users
} as const

/**
 * Routine engagement weights
 */
export const ROUTINE_ENGAGEMENT_WEIGHTS = {
  adapt: 0.4,
  save: 0.3,
  like: 0.2,
  dislike: -0.3,
  view: 0.0,
} as const

/**
 * Convert frequency to weight (0.1 to 1.0)
 */
export function getFrequencyWeight(frequency: {
  interval: number
  unit: 'day' | 'week' | 'month'
}): number {
  let timesPerMonth: number

  switch (frequency.unit) {
    case 'day':
      timesPerMonth = 30 / frequency.interval
      break
    case 'week':
      timesPerMonth = 4 / frequency.interval
      break
    case 'month':
      timesPerMonth = 1 / frequency.interval
      break
  }

  const normalized = Math.min(timesPerMonth / 30, 1.0)
  return Math.max(normalized, 0.1)
}
