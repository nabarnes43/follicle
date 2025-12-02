// functions/src/utils/follicleSimilarity.ts
import {
  FOLLICLE_WEIGHTS,
  TOTAL_FOLLICLE_WEIGHT,
  MIN_SIMILARITY_THRESHOLD,
  EXACT_MATCH_BOOST,
} from '../config/constants'

export function calculateFollicleSimilarity(
  follicleId1: string,
  follicleId2: string
): number {
  if (follicleId1 === follicleId2) {
    return Math.min(1.0, 1.0 * EXACT_MATCH_BOOST)
  }

  const parts1 = follicleId1.split('-')
  const parts2 = follicleId2.split('-')

  if (parts1.length !== 5 || parts2.length !== 5) {
    console.warn('Invalid follicle ID format:', follicleId1, follicleId2)
    return 0
  }

  let matchedWeight = 0

  const weightArray = [
    FOLLICLE_WEIGHTS.hairType,
    FOLLICLE_WEIGHTS.porosity,
    FOLLICLE_WEIGHTS.density,
    FOLLICLE_WEIGHTS.thickness,
    FOLLICLE_WEIGHTS.damage,
  ]

  for (let i = 0; i < 5; i++) {
    if (parts1[i] === parts2[i]) {
      matchedWeight += weightArray[i]
    }
  }

  const similarity = matchedWeight / TOTAL_FOLLICLE_WEIGHT

  return Math.min(similarity, 1.0)
}

export function isSimilarEnough(
  follicleId1: string,
  follicleId2: string
): boolean {
  const similarity = calculateFollicleSimilarity(follicleId1, follicleId2)
  return similarity >= MIN_SIMILARITY_THRESHOLD
}
