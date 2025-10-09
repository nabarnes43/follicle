import { Product, HairTypeEngagement } from '@/types/product'
import { HairAnalysis } from '@/types/user'
import { MatchScore } from '@/types/matching'
import { HAIR_TYPE_INGREDIENTS } from './ingredientProfiles'

export class ProductMatcher {
  private hairAnalysis: HairAnalysis

  constructor(hairAnalysis: HairAnalysis) {
    this.hairAnalysis = hairAnalysis
  }

  /**
   * Main matching function
   */
  matchProducts(
    products: Product[],
    category?: string,
    limit: number = 10
  ): MatchScore[] {
    // Step 1: Filter by category and budget
    const filteredProducts = this.applyFilters(products, category)

    // Step 2: Score each product
    const scoredProducts = filteredProducts.map((product) =>
      this.scoreProduct(product)
    )

    // Step 3: Sort by score and limit
    return scoredProducts
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
  }

  /**
   * Apply filters (category, budget)
   */
  private applyFilters(products: Product[], category?: string): Product[] {
    return products.filter((product) => {
      // Category filter
      if (category && product.category !== category) {
        return false
      }

      // Budget filter
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
   * Score a single product
   * ONLY based on ingredients and real user feedback
   */
  private scoreProduct(product: Product): MatchScore {
    const matchReasons: string[] = []

    // 1. Ingredient Score (60%) - What's actually IN the product
    const ingredientScore = this.calculateIngredientScore(
      product,
      matchReasons,
      true
    )

    // 2. Engagement Score (40%) - What users with YOUR hair type say about it
    const engagementScore = this.calculateEngagementScore(
      product,
      matchReasons,
      true
    )

    // Weighted total (ingredients matter slightly more than engagement)
    const totalScore = ingredientScore * 0.6 + engagementScore * 0.4

    // Calculate scores for all hair types
    const allHairTypeScores = this.scoreForAllHairTypes(product)

    return {
      product,
      totalScore,
      breakdown: {
        ingredientScore,
        engagementScore,
      },
      matchReasons,
      allHairTypeScores,
    }
  }

  /**
   * Calculate scores for all hair types
   * Useful for showing cross-hair-type popularity
   */
  private scoreForAllHairTypes(product: Product): {
    straight: number
    wavy: number
    curly: number
    coily: number
    protective: number
  } {
    const hairTypes = [
      'straight',
      'wavy',
      'curly',
      'coily',
      'protective',
    ] as const
    const scores: any = {}

    hairTypes.forEach((hairType) => {
      // Create a temporary analysis with this hair type
      const tempAnalysis: HairAnalysis = {
        ...this.hairAnalysis,
        hairType,
      }

      // Create temporary matcher
      const tempMatcher = new ProductMatcher(tempAnalysis)

      // Calculate scores without match reasons (we only need the numbers)
      const ingredientScore = tempMatcher.calculateIngredientScore(
        product,
        [],
        false
      )
      const engagementScore = tempMatcher.calculateEngagementScore(
        product,
        [],
        false
      )

      // Calculate weighted score
      scores[hairType] = ingredientScore * 0.6 + engagementScore * 0.4
    })

    return scores
  }

  /**
   * Calculate ingredient-based score
   * Based on what's actually in the formula
   */
  private calculateIngredientScore(
    product: Product,
    matchReasons: string[],
    addReasons: boolean = true
  ): number {
    const profile = HAIR_TYPE_INGREDIENTS[this.hairAnalysis.hairType]

    // Handle missing ingredient data
    if (
      !product.ingredients_normalized ||
      product.ingredients_normalized.length === 0
    ) {
      // No ingredient data = neutral score
      if (addReasons) {
        matchReasons.push('⚠️ Ingredient data not available')
      }
      return 0.5
    }

    const productIngredients = product.ingredients_normalized.map((i) =>
      i.toLowerCase()
    )

    let score = 0.5 // Start neutral
    const foundBeneficial: string[] = []
    const foundAvoid: string[] = []

    // Check beneficial ingredients (position matters - earlier is better)
    profile.beneficial.forEach((beneficial) => {
      const index = productIngredients.indexOf(beneficial.toLowerCase())
      if (index !== -1) {
        foundBeneficial.push(beneficial)
        // Top 5 ingredients = stronger effect
        const positionBonus = index < 5 ? 0.15 : 0.05
        score += positionBonus
      }
    })

    // Check ingredients to avoid
    profile.avoid.forEach((avoid) => {
      if (productIngredients.some((ing) => ing.includes(avoid.toLowerCase()))) {
        foundAvoid.push(avoid)
        score -= 0.2
      }
    })

    // Add match reasons
    if (addReasons) {
      if (foundBeneficial.length > 0) {
        matchReasons.push(
          `Contains ${foundBeneficial.slice(0, 2).join(', ')} for ${this.hairAnalysis.hairType} hair`
        )
      }

      if (foundAvoid.length > 0) {
        matchReasons.push(
          `⚠️ Contains ${foundAvoid[0]} (not ideal for your hair type)`
        )
      }
    }

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate engagement score
   * ONLY from users with the SAME hair type
   */
  private calculateEngagementScore(
    product: Product,
    matchReasons: string[],
    addReasons: boolean = true
  ): number {
    // Handle missing engagement stats entirely
    if (!product.engagement_stats) {
      if (addReasons) {
        matchReasons.push('⚠️ Engagement data not available')
      }
      return 0.5 // Neutral score for products with no engagement data yet
    }

    const stats: HairTypeEngagement =
      product.engagement_stats[this.hairAnalysis.hairType]

    // No data from your hair type? Neutral score
    if (!stats || stats.views === 0) {
      return 0.5
    }

    // Calculate real user behavior metrics
    const likeRatio = (stats.likes - stats.dislikes) / stats.views
    const routineRate = stats.routines / stats.views // Strong signal: they use it regularly
    const saveRate = stats.saves / stats.views // Strong signal: they want to remember it
    const rerollRate = stats.rerolls / stats.views // Negative signal: they skipped it

    // Weighted score based on user actions
    // Routines = strongest signal (people actually use it)
    // Saves = second strongest (people want it)
    // Likes = third (quick feedback)
    // Rerolls = negative (active rejection)
    const normalizedScore =
      0.35 * routineRate + // 35% - Do they actually use it?
      0.25 * saveRate + // 25% - Do they want to remember it?
      0.25 * Math.max(-1, Math.min(1, likeRatio)) - // 25% - Likes vs dislikes
      0.15 * rerollRate // 15% - Did they skip it?

    // Convert to [0,1]
    const finalScore = Math.max(0, Math.min(1, (normalizedScore + 1) / 2))

    // Add match reasons based on real user behavior
    if (addReasons) {
      if (finalScore > 0.7) {
        matchReasons.push(
          `Highly rated by people with ${this.hairAnalysis.hairType} hair`
        )
      }

      if (stats.routines > 10) {
        matchReasons.push(`Used in ${stats.routines} routines`)
      }

      if (stats.saves > 5) {
        matchReasons.push(`Saved by ${stats.saves} users`)
      }
    }

    return finalScore
  }
}

/**
 * Helper function for easy usage
 */
export function matchProductsForUser(
  user: { hairAnalysis: HairAnalysis },
  products: Product[],
  options: {
    category?: string
    limit?: number
  } = {}
): MatchScore[] {
  const matcher = new ProductMatcher(user.hairAnalysis)

  return matcher.matchProducts(products, options.category, options.limit || 10)
}
