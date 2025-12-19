import { Routine } from '../../types/routine'
import { Product } from '../../types/product'
import { matchProductsForUser } from '../../products/scoring/productMatcher'
import { getStepCategoryWeight } from '../config/stepCategories'
import { getFrequencyWeight } from '../config/routineWeights'

/**
 * Score a routine based on the quality of its products
 * Aggregates product scores weighted by step importance and frequency
 */
export async function scoreRoutineProducts(
  routine: Routine,
  allProducts: Product[],
  follicleId: string,
  db: FirebaseFirestore.Firestore
): Promise<number> {
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const step of routine.steps) {
    if (!step.product_id) continue

    const stepWeight = getStepCategoryWeight(step.step_name)
    const frequencyWeight = getFrequencyWeight(step.frequency)

    const product = allProducts.find((p) => p.id === step.product_id)

    if (!product) {
      console.warn(`Product not found: ${step.product_id}`)
      continue
    }

    const scoredProducts = await matchProductsForUser(
      [product],
      follicleId,
      db,
    )

    if (scoredProducts.length === 0) {
      continue
    }

    const productScore = scoredProducts[0].totalScore
    const combinedWeight = stepWeight * frequencyWeight

    totalWeightedScore += productScore * combinedWeight
    totalWeight += combinedWeight
  }

  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0.5
}
