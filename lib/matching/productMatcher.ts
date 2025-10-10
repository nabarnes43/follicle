import { Product } from '@/types/product'
import { HairAnalysis } from '@/types/user'
import { MatchScore } from '@/types/matching'
import { generateFollicleId } from '@/lib/quiz/follicleId'
import { scoreByIngredients } from './scoring/ingredientScoring'
import { scoreByEngagement } from './scoring/engagementScoring'
import { ALGORITHM_WEIGHTS } from './config/weights'

const BATCH_SIZE = 2000 // Process 2000 products at a time

export class ProductMatcher {
  private hairAnalysis: HairAnalysis
  private follicleId: string

  constructor(hairAnalysis: HairAnalysis, follicleId: string) {
    this.hairAnalysis = hairAnalysis
    this.follicleId = follicleId // Just use what's passed in
  }

  /**
   * Main matching function with batched scoring
   */
  async matchProducts(
    products: Product[],
    category?: string,
    limit: number = 9999
  ): Promise<MatchScore[]> {
    // Filter first
    const filteredProducts = this.applyFilters(products, category)

    // Score in batches to prevent Firestore overload
    const scoredProducts: MatchScore[] = []

    for (let i = 0; i < filteredProducts.length; i += BATCH_SIZE) {
      const batch = filteredProducts.slice(i, i + BATCH_SIZE)

      // Process this batch in parallel
      const batchScores = await Promise.all(
        batch.map((product) => this.scoreProduct(product))
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

  private applyFilters(products: Product[], category?: string): Product[] {
    return products.filter((product) => {
      if (category && product.category !== category) {
        return false
      }

      if (
        this.hairAnalysis.budget &&
        product.price > this.hairAnalysis.budget
      ) {
        return false
      }

      return true
    })
  }

  /**
   * Score a single product with BOTH ingredient + engagement
   */
  private async scoreProduct(product: Product): Promise<MatchScore> {
    const matchReasons: string[] = []

    // 1. Ingredient Score (60%)
    const { score: ingredientScore, reasons: ingredientReasons } =
      scoreByIngredients(product, this.hairAnalysis, true)

    matchReasons.push(...ingredientReasons)

    // 2. Engagement Score (40%) - WITH fuzzy matching
    const {
      score: engagementScore,
      reasons: engagementReasons,
      similarityMetrics,
    } = await scoreByEngagement(product, this.follicleId, true)

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
      similarityMetrics,
    }
  }
}

/**
 * Helper function - async now
 */
export async function matchProductsForUser(
  user: { hairAnalysis: HairAnalysis },
  products: Product[],
  follicleId: string,
  options: {
    category?: string
    limit?: number
  } = {}
): Promise<MatchScore[]> {
  const matcher = new ProductMatcher(user.hairAnalysis, follicleId)

  return matcher.matchProducts(
    products,
    options.category,
    options.limit || 9999
  )
}
