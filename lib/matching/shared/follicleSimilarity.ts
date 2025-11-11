import {
  FOLLICLE_WEIGHTS,
  TOTAL_FOLLICLE_WEIGHT,
  MIN_SIMILARITY_THRESHOLD,
  EXACT_MATCH_BOOST,
} from './constants'

/**
 * Calculate similarity between two follicle IDs
 * Returns a score from 0.0 (completely different) to 1.0 (identical)
 *
 * Uses weighted matching - some characteristics matter more than others.
 *
 * @example
 * calculateFollicleSimilarity('CU-H-M-F-N', 'CU-H-M-C-N')
 * // Returns: 0.78 (7/9 weighted match - only thickness differs)
 */
export function calculateFollicleSimilarity(
  follicleId1: string,
  follicleId2: string
): number {
  // Handle exact match with boost
  if (follicleId1 === follicleId2) {
    return Math.min(1.0, 1.0 * EXACT_MATCH_BOOST)
  }

  // Split into parts
  const parts1 = follicleId1.split('-')
  const parts2 = follicleId2.split('-')

  // Validate format
  if (parts1.length !== 5 || parts2.length !== 5) {
    console.warn('Invalid follicle ID format:', follicleId1, follicleId2)
    return 0
  }

  // Calculate weighted similarity
  let matchedWeight = 0

  // Array of weights in order: [hairType, porosity, density, thickness, damage]
  const weightArray = [
    FOLLICLE_WEIGHTS.hairType,
    FOLLICLE_WEIGHTS.porosity,
    FOLLICLE_WEIGHTS.density,
    FOLLICLE_WEIGHTS.thickness,
    FOLLICLE_WEIGHTS.damage,
  ]

  // Compare each position
  for (let i = 0; i < 5; i++) {
    if (parts1[i] === parts2[i]) {
      matchedWeight += weightArray[i]
    }
  }

  // Normalize to 0-1 range
  const similarity = matchedWeight / TOTAL_FOLLICLE_WEIGHT

  return Math.min(similarity, 1.0)
}

/**
 * Check if two follicle IDs are similar enough to be considered
 * Uses MIN_SIMILARITY_THRESHOLD from config
 */
export function isSimilarEnough(
  follicleId1: string,
  follicleId2: string
): boolean {
  const similarity = calculateFollicleSimilarity(follicleId1, follicleId2)
  return similarity >= MIN_SIMILARITY_THRESHOLD
}
