// functions/src/config/constants.ts
// Copied from lib/matching/shared/constants.ts

export const MATCH_REASONS_CONFIG = {
  maxReasonsTotal: 100,
  maxBeneficialPerCharacteristic: 10,
  maxAvoidedPerCharacteristic: 10,
} as const

export const FOLLICLE_WEIGHTS = {
  hairType: 3,
  porosity: 2,
  density: 1,
  thickness: 2,
  damage: 1,
} as const

export const TOTAL_FOLLICLE_WEIGHT =
  FOLLICLE_WEIGHTS.hairType +
  FOLLICLE_WEIGHTS.porosity +
  FOLLICLE_WEIGHTS.density +
  FOLLICLE_WEIGHTS.thickness +
  FOLLICLE_WEIGHTS.damage

export const SIMILARITY_THRESHOLDS = {
  exact: 1.0,
  veryHigh: 0.8,
  high: 0.6,
  medium: 0.4,
} as const

export const MIN_SIMILARITY_THRESHOLD = SIMILARITY_THRESHOLDS.medium

export const ENGAGEMENT_SCORE_DEFAULTS = {
  NEUTRAL_SCORE: 0.5,
  MIN_SCORE: 0,
  MAX_SCORE: 1,
}

export const EXACT_MATCH_BOOST = 1.5
