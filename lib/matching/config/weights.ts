/**
 * RECOMMENDATION ALGORITHM WEIGHTS
 *
 * All weights that control how products are matched to users.
 * This is the ONLY file your cosmetic scientist needs to adjust!
 *
 * Adjust these as you learn more about what matters for recommendations.
 */

// ============================================================================
// FOLLICLE ID WEIGHTS
// ============================================================================

/**
 * How important is each part of the follicle ID?
 *
 * Used for:
 * 1. Finding similar users (engagement scoring)
 * 2. Weighting ingredient categories (auto-calculated below)
 *
 * Example: CU-H-M-F-N
 *          ↑  ↑ ↑ ↑ ↑
 *          3  2 1 2 1  ← these weights
 *
 * Higher weight = more important
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
 *
 * Users are categorized into buckets based on how similar their hair is:
 * - Exact (1.0): Identical follicle ID - "hair twins"
 * - Very High (0.8+): Nearly identical hair characteristics
 * - High (0.6+): Very similar hair profiles
 * - Medium (0.4+): Similar enough to provide valuable feedback
 *
 * Any user below the minimum threshold is excluded from scoring
 */
export const SIMILARITY_THRESHOLDS = {
  exact: 1.0,
  veryHigh: 0.8,
  high: 0.6,
  medium: 0.4,
} as const

/**
 * Minimum similarity threshold for engagement scoring
 * Users below this similarity won't count toward product scores
 * Range: 0.0 (anyone) to 1.0 (exact match only)
 *
 * Set to 0.4 = only users with 40%+ similar hair characteristics
 * This should always match SIMILARITY_THRESHOLDS.medium to ensure
 * the "medium" bucket represents the floor of what we consider relevant
 */
export const MIN_SIMILARITY_THRESHOLD = SIMILARITY_THRESHOLDS.medium

/**
 * Exact match boost
 * How much extra weight for exact follicle ID matches?
 */
export const EXACT_MATCH_BOOST = 1.5 // 50% boost

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
// ALGORITHM WEIGHTS
// ============================================================================

/**
 * Master algorithm balance
 * How much does science vs. community matter?
 */
export const ALGORITHM_WEIGHTS = {
  ingredient: 0.6, // 60% - Science (what's IN the product)
  engagement: 0.4, // 40% - Community (what users with your hair say)
} as const

// Validation
const algorithmTotal =
  ALGORITHM_WEIGHTS.ingredient + ALGORITHM_WEIGHTS.engagement
if (Math.abs(algorithmTotal - 1.0) > 0.001) {
  console.warn(
    '⚠️ ALGORITHM_WEIGHTS should sum to 1.0, currently:',
    algorithmTotal
  )
}

// ============================================================================
// INGREDIENT SCORING WEIGHTS
// ============================================================================

/**
 * Ingredient category weights
 * Auto-calculated from FOLLICLE_WEIGHTS above
 *
 * DO NOT EDIT THESE - Edit FOLLICLE_WEIGHTS instead!
 */
export const INGREDIENT_CATEGORY_WEIGHTS = {
  hairType: FOLLICLE_WEIGHTS.hairType / TOTAL_FOLLICLE_WEIGHT, // 0.33
  porosity: FOLLICLE_WEIGHTS.porosity / TOTAL_FOLLICLE_WEIGHT, // 0.22
  thickness: FOLLICLE_WEIGHTS.thickness / TOTAL_FOLLICLE_WEIGHT, // 0.22
  density: FOLLICLE_WEIGHTS.density / TOTAL_FOLLICLE_WEIGHT, // 0.11
  damage: FOLLICLE_WEIGHTS.damage / TOTAL_FOLLICLE_WEIGHT, // 0.11
} as const

/**
 * Ingredient position scoring
 * Earlier ingredients = higher concentration = more impact
 */
export const INGREDIENT_POSITION_CONFIG = {
  maxPositionScore: 0.2, // Max bonus for position 1
  usePositionScoring: true, // Enable/disable position weighting
} as const

/**
 * Calculate position score
 * Formula: score = max * (1 - position/total)
 */
export function getPositionScore(
  position: number,
  totalIngredients: number
): number {
  if (!INGREDIENT_POSITION_CONFIG.usePositionScoring) return 0
  if (totalIngredients === 0) return 0

  const oneBasedPosition = position + 1
  const positionRatio = 1 - oneBasedPosition / totalIngredients

  return INGREDIENT_POSITION_CONFIG.maxPositionScore * positionRatio
}

/**
 * Scoring modifiers
 */
export const SCORING_MODIFIERS = {
  beneficialBonus: 0.1, // +10% per beneficial ingredient
  avoidPenalty: -0.25, // -25% per avoided ingredient
  noIngredientData: 0.5, // Neutral if no data
  minScore: 0.0,
  maxScore: 1.0,
} as const

// ============================================================================
// ENGAGEMENT SCORING WEIGHTS
// ============================================================================

/**
 * Engagement weights
 * How much does each user action matter?
 */
export const ENGAGEMENT_WEIGHTS = {
  routine: 0.35, // Strongest signal (they USE it)
  save: 0.25, // Strong signal (they want it)
  like: 0.25, // Medium signal (quick feedback)
  dislike: -0.25, // Negative signal
  reroll: -0.15, // Weak negative signal
  view: 0.0, // Neutral
} as const

/**
 * Engagement normalization
 */
export const ENGAGEMENT_NORMALIZATION = {
  minViews: 1, // Min views to use engagement score
  useWeightedAverage: true, // Weight by follicle similarity
} as const

// ============================================================================
// CATEGORY OVERRIDES (Advanced)
// ============================================================================

/**
 * Category-specific overrides
 * Use different weights for specific product categories
 */
export const CATEGORY_OVERRIDES: Record<
  string,
  Partial<typeof ALGORITHM_WEIGHTS>
> = {
  // Example:
  // 'Gel, Pomade & Wax': {
  //   ingredient: 0.4,
  //   engagement: 0.6
  // }
}

/**
 * Get weights for a specific category
 */
export function getAlgorithmWeights(
  category?: string
): typeof ALGORITHM_WEIGHTS {
  if (category && CATEGORY_OVERRIDES[category]) {
    return {
      ...ALGORITHM_WEIGHTS,
      ...CATEGORY_OVERRIDES[category],
    } as typeof ALGORITHM_WEIGHTS
  }
  return ALGORITHM_WEIGHTS
}
