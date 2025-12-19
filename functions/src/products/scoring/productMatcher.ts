import { Product } from '../../types/product'
import { ProductMatchScore } from '../../types/productMatching'
import { scoreByIngredients } from './ingredientScoring'
import { scoreProductByEngagement } from './productEngagementScoring'
import { ALGORITHM_WEIGHTS } from '../config/productWeights'

const BATCH_SIZE = 2000 // Process 2000 products at a time

/**
 * Score a single product with ingredient + engagement
 */
async function scoreProduct(
  product: Product,
  follicleId: string,
  db: FirebaseFirestore.Firestore
): Promise<ProductMatchScore> {
  const matchReasons: string[] = []

  // 1. Ingredient Score (60%)
  const { score: ingredientScore, reasons: ingredientReasons } =
    scoreByIngredients(product, follicleId, true)

  matchReasons.push(...ingredientReasons)

  // 2. Engagement Score (40%)
  const {
    score: engagementScore,
    reasons: engagementReasons,
    interactionsByTier,
  } = await scoreProductByEngagement(product, follicleId, true, db)

  matchReasons.push(...engagementReasons)

  // 3. Weighted total
  const totalScore =
    ingredientScore * ALGORITHM_WEIGHTS.ingredient +
    engagementScore * ALGORITHM_WEIGHTS.engagement

  return {
    product,
    totalScore,
    breakdown: {
      ingredientScore,
      engagementScore,
    },
    matchReasons,
    interactionsByTier,
  }
}

/**
 * Match products for a user
 * Scores all provided products based on follicle ID
 *
 * @param products - Products to score
 * @param follicleId - User's follicle ID
 * @param db - Firestore instance
 * @returns Scored and sorted products
 */
export async function matchProductsForUser(
  products: Product[],
  follicleId: string,
  db: FirebaseFirestore.Firestore
): Promise<ProductMatchScore[]> {
  // Score in batches to prevent Firestore overload
  const scoredProducts: ProductMatchScore[] = []

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)
    const batchScores = await Promise.all(
      batch.map((product) => scoreProduct(product, follicleId, db))
    )
    scoredProducts.push(...batchScores)
  }

  // Sort by score (highest first)
  return scoredProducts.sort((a, b) => b.totalScore - a.totalScore)
}
