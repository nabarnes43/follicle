import { Product } from '../../types/product'
import { HairAnalysis } from '../../types/user'
import { ProductMatchScore } from '../../types/productMatching'
import { scoreByIngredients } from './ingredientScoring'
import { scoreByEngagement } from './productEngagementScoring'
import { ALGORITHM_WEIGHTS } from '../config/productWeights'

const BATCH_SIZE = 2000 // Process 2000 products at a time

/**
 * Apply filters to products (category, budget, etc.)
 */
function applyFilters(
  products: Product[],
  hairAnalysis: HairAnalysis,
  category?: string
): Product[] {
  return products.filter((product) => {
    if (category && product.category !== category) {
      return false
    }

    if (hairAnalysis.budget && product.price > hairAnalysis.budget) {
      return false
    }

    return true
  })
}

/**
 * Score a single product with ingredient + engagement
 */
async function scoreProduct(
  product: Product,
  hairAnalysis: HairAnalysis,
  follicleId: string
): Promise<ProductMatchScore> {
  const matchReasons: string[] = []

  // 1. Ingredient Score (60%)
  const { score: ingredientScore, reasons: ingredientReasons } =
    scoreByIngredients(product, hairAnalysis, true)

  matchReasons.push(...ingredientReasons)

  // 2. Engagement Score (40%)
  const {
    score: engagementScore,
    reasons: engagementReasons,
    interactionsByTier,
  } = await scoreByEngagement(product, follicleId, true)

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
 * Main entry point for product matching
 *
 * @param user - User with hair analysis
 * @param products - Products to score
 * @param follicleId - User's follicle ID
 * @param options - Category filter and limit
 * @returns Scored and sorted products
 */
export async function matchProductsForUser(
  user: { hairAnalysis: HairAnalysis },
  products: Product[],
  follicleId: string,
  options: {
    category?: string
    limit?: number
  } = {}
): Promise<ProductMatchScore[]> {
  const { category, limit = 9999 } = options

  // Filter products
  const filteredProducts = applyFilters(products, user.hairAnalysis, category)

  // Score in batches to prevent Firestore overload
  const scoredProducts: ProductMatchScore[] = []

  for (let i = 0; i < filteredProducts.length; i += BATCH_SIZE) {
    const batch = filteredProducts.slice(i, i + BATCH_SIZE)

    // Process this batch in parallel
    const batchScores = await Promise.all(
      batch.map((product) =>
        scoreProduct(product, user.hairAnalysis, follicleId)
      )
    )

    scoredProducts.push(...batchScores)

    // Log progress
    console.log(
      `Scored ${Math.min(i + BATCH_SIZE, filteredProducts.length)} / ${filteredProducts.length} products`
    )
  }

  // Sort and limit
  return scoredProducts
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit)
}
