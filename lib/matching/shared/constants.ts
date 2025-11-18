/**
 * SHARED CONSTANTS
 * Used by both product and routine matching systems
 * Single source of truth for follicle similarity logic
 */

// ============================================================================
// DISPLAY SETTINGS
// ============================================================================

/**
 * Match reasons display limits
 * Controls how many reasons are shown to users
 */
export const MATCH_REASONS_CONFIG = {
  maxReasonsTotal: 100, // Maximum total reasons to show
  maxBeneficialPerCharacteristic: 10, // Max beneficial ingredients per characteristic
  maxAvoidedPerCharacteristic: 10, // Max avoided ingredients per characteristic
} as const

// ============================================================================
// FOLLICLE ID WEIGHTS
// ============================================================================

/**
 * How important is each part of the follicle ID?
 * Higher weight = more important for similarity matching
 */
export const FOLLICLE_WEIGHTS = {
  hairType: 3, // Position 0: ST/WV/CU/CO/PR
  porosity: 2, // Position 1: L/M/H
  density: 1, // Position 2: L/M/H
  thickness: 2, // Position 3: F/M/C
  damage: 1, // Position 4: N/S/V
} as const

/**
 * Total weight (calculated automatically)
 */
export const TOTAL_FOLLICLE_WEIGHT =
  FOLLICLE_WEIGHTS.hairType +
  FOLLICLE_WEIGHTS.porosity +
  FOLLICLE_WEIGHTS.density +
  FOLLICLE_WEIGHTS.thickness +
  FOLLICLE_WEIGHTS.damage
// = 9

// ============================================================================
// SIMILARITY THRESHOLDS
// ============================================================================

/**
 * Similarity thresholds for engagement scoring
 * Defines how we bucket users by hair similarity
 */
export const SIMILARITY_THRESHOLDS = {
  exact: 1.0, // Identical follicle ID
  veryHigh: 0.8, // Nearly identical
  high: 0.6, // Very similar
  medium: 0.4, // Similar enough to be relevant
} as const

/**
 * Minimum similarity threshold
 * Users below this won't count toward engagement scores
 */
export const MIN_SIMILARITY_THRESHOLD = SIMILARITY_THRESHOLDS.medium

export const ENGAGEMENT_SCORE_DEFAULTS = {
  NEUTRAL_SCORE: 0.5,
  MIN_SCORE: 0,
  MAX_SCORE: 1,
}

/**
 * Exact match boost
 * How much extra weight for exact follicle ID matches
 */
export const EXACT_MATCH_BOOST = 1.5 // 50% boost
