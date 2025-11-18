
/**
 * RECOMMENDATION ALGORITHM WEIGHTS
 *
 * All weights that control how products are matched to users.
 * This is the ONLY file your cosmetic scientist needs to adjust!
 *
 * Adjust these as you learn more about what matters for recommendations.
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
  ENGAGEMENT_SCORE_DEFAULTS,
  MATCH_REASONS_CONFIG,
} from '../../shared/constants'

// Re-export for convenience
export {
  FOLLICLE_WEIGHTS,
  TOTAL_FOLLICLE_WEIGHT,
  SIMILARITY_THRESHOLDS,
  MIN_SIMILARITY_THRESHOLD,
  EXACT_MATCH_BOOST,
  ENGAGEMENT_SCORE_DEFAULTS,
  MATCH_REASONS_CONFIG,
}

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
