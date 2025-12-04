// functions/src/config/productWeights.ts
import {
  FOLLICLE_WEIGHTS,
  TOTAL_FOLLICLE_WEIGHT,
  SIMILARITY_THRESHOLDS,
  MIN_SIMILARITY_THRESHOLD,
  EXACT_MATCH_BOOST,
  ENGAGEMENT_SCORE_DEFAULTS,
  MATCH_REASONS_CONFIG,
} from '../../shared/constants'

export {
  FOLLICLE_WEIGHTS,
  TOTAL_FOLLICLE_WEIGHT,
  SIMILARITY_THRESHOLDS,
  MIN_SIMILARITY_THRESHOLD,
  EXACT_MATCH_BOOST,
  ENGAGEMENT_SCORE_DEFAULTS,
  MATCH_REASONS_CONFIG,
}

export const ALGORITHM_WEIGHTS = {
  ingredient: 0.6,
  engagement: 0.4,
} as const

export const INGREDIENT_CATEGORY_WEIGHTS = {
  hairType: FOLLICLE_WEIGHTS.hairType / TOTAL_FOLLICLE_WEIGHT,
  porosity: FOLLICLE_WEIGHTS.porosity / TOTAL_FOLLICLE_WEIGHT,
  thickness: FOLLICLE_WEIGHTS.thickness / TOTAL_FOLLICLE_WEIGHT,
  density: FOLLICLE_WEIGHTS.density / TOTAL_FOLLICLE_WEIGHT,
  damage: FOLLICLE_WEIGHTS.damage / TOTAL_FOLLICLE_WEIGHT,
} as const

export const INGREDIENT_POSITION_CONFIG = {
  maxPositionScore: 0.2,
  usePositionScoring: true,
} as const

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

export const SCORING_MODIFIERS = {
  beneficialBonus: 0.1,
  avoidPenalty: -0.25,
  noIngredientData: 0.5,
  minScore: 0.0,
  maxScore: 1.0,
} as const

export const ENGAGEMENT_WEIGHTS = {
  routine: 0.35,
  save: 0.25,
  like: 0.25,
  dislike: -0.25,
  reroll: -0.15,
  view: 0.0,
} as const

export const CATEGORY_OVERRIDES: Record<
  string,
  Partial<typeof ALGORITHM_WEIGHTS>
> = {}

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
