import { Routine } from '@/types/routine'
import { Product } from '@/types/product'
import { HairAnalysis } from '@/types/user'
import { matchProductsForUser } from '../../products/productMatcher'
import { getStepCategoryWeight } from '../config/stepCategories'
import { getFrequencyWeight } from '../config/routineWeights'

/**
 * Score a routine based on the quality of its products
 * Aggregates product scores weighted by step importance and frequency
 *
 * Uses existing product matching system to score each product,
 * then combines them with step/frequency weights
 *
 * @param routine - Routine to score
 * @param allProducts - Full product database (for lookup)
 * @param userHairAnalysis - User's hair characteristics
 * @param userFollicleId - User's follicle ID
 * @returns Aggregated product score (0-1)
 */
export async function scoreRoutineProducts(
  routine: Routine,
  allProducts: Product[],
  userHairAnalysis: HairAnalysis,
  userFollicleId: string
): Promise<number> {
  let totalWeightedScore = 0
  let totalWeight = 0

  // Iterate through each step in the routine
  for (const step of routine.steps) {
    // Skip steps without a product
    if (!step.product_id) continue

    // Get step category weight (e.g., Shampoo = 1.0, Gel = 0.6)
    const stepWeight = getStepCategoryWeight(step.step_name)

    // Get frequency weight (daily = 1.0, monthly = 0.1)
    const frequencyWeight = getFrequencyWeight(step.frequency)

    // Find the product in our database
    const product = allProducts.find((p) => p.id === step.product_id)

    if (!product) {
      console.warn(`Product not found: ${step.product_id}`)
      continue
    }

    // Score this product using existing product matcher
    // This gives us ingredient + engagement scores
    const scoredProducts = await matchProductsForUser(
      { hairAnalysis: userHairAnalysis },
      [product],
      userFollicleId,
      { limit: 1 }
    )

    if (scoredProducts.length === 0) {
      // If scoring failed, skip this product
      continue
    }

    const productScore = scoredProducts[0].totalScore

    // Combine weights: step importance × frequency
    const combinedWeight = stepWeight * frequencyWeight

    // Add to totals
    totalWeightedScore += productScore * combinedWeight
    totalWeight += combinedWeight
  }

  // Return weighted average, or neutral if no products scored
  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0.5
}
