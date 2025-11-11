/**
 * ROUTINE MATCHING WEIGHTS
 * 
 * Controls how routines are scored and matched to users
 * Separate from product weights to allow independent tuning
 */

/**
 * Import and re-export shared constants
 */
import {
  FOLLICLE_WEIGHTS,
  TOTAL_FOLLICLE_WEIGHT,
  SIMILARITY_THRESHOLDS,
  MIN_SIMILARITY_THRESHOLD,
  EXACT_MATCH_BOOST,
} from '../../shared/constants'

// Re-export for convenience
export {
  FOLLICLE_WEIGHTS,
  TOTAL_FOLLICLE_WEIGHT,
  SIMILARITY_THRESHOLDS,
  MIN_SIMILARITY_THRESHOLD,
  EXACT_MATCH_BOOST,
}

// ============================================================================
// ALGORITHM WEIGHTS
// ============================================================================

/**
 * Master algorithm balance for routines
 * How much does product quality vs. community validation matter?
 */
export const ROUTINE_ALGORITHM_WEIGHTS = {
  product: 0.10,     // 10% - Quality of products in the routine
  engagement: 0.90,  // 90% - Community validation from similar users
} as const

// Validation
const routineAlgorithmTotal =
  ROUTINE_ALGORITHM_WEIGHTS.product + ROUTINE_ALGORITHM_WEIGHTS.engagement
if (Math.abs(routineAlgorithmTotal - 1.0) > 0.001) {
  console.warn(
    '⚠️ ROUTINE_ALGORITHM_WEIGHTS should sum to 1.0, currently:',
    routineAlgorithmTotal
  )
}

// ============================================================================
// ENGAGEMENT WEIGHTS
// ============================================================================

/**
 * Routine engagement weights
 * Different from products - adapt is strongest signal for routines
 */
export const ROUTINE_ENGAGEMENT_WEIGHTS = {
  adapt: 0.40,    // Strongest signal (they copied it to use)
  save: 0.30,     // Strong signal (they bookmarked it)
  like: 0.20,     // Medium signal (quick positive feedback)
  dislike: -0.30, // Negative signal
  view: 0.0,      // Used only for rate normalization
} as const


// ============================================================================
// FREQUENCY WEIGHTS
// ============================================================================

/**
 * Convert routine/step frequency to a weight (0-1)
 * More frequent = higher weight in product score calculation
 * 
 * @param frequency - Frequency object with interval and unit
 * @returns Weight from 0.1 (monthly) to 1.0 (daily)
 * 
 * @example
 * getFrequencyWeight({ interval: 1, unit: 'day' })  // 1.0 (daily)
 * getFrequencyWeight({ interval: 2, unit: 'week' }) // 0.53 (twice weekly)
 * getFrequencyWeight({ interval: 1, unit: 'month' }) // 0.1 (monthly)
 */
export function getFrequencyWeight(frequency: {
  interval: number
  unit: 'day' | 'week' | 'month'
}): number {
  // Convert to times per month
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

  // Normalize to 0.1-1.0 range (daily = 1.0, monthly = 0.1)
  // Using 30 as max (daily = 30 times/month)
  const normalized = Math.min(timesPerMonth / 30, 1.0)
  
  // Floor at 0.1 so even monthly routines have some weight
  return Math.max(normalized, 0.1)
}