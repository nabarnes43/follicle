import { Product } from './product'

/** Minimal product data stored in product_scores for card display */
export interface ProductCardData {
  id: string
  name: string
  brand: string
  image_url: string | null
  price: number | null
  category: string
}

/** Pre-computed score from Firestore subcollection */
export interface PreComputedProductMatchScore {
  product: ProductCardData
  totalScore: number
  breakdown: {
    ingredientScore: number
    engagementScore: number
  }
  matchReasons: string[]
}

/**
 * RecommendationsResponse - API response from /api/productRecommendations
 *
 * This is NOT just a list of products - it's a personalized response containing:
 * 1. Scored products (MatchScore[]) tailored to the user's hair
 * 2. Context about WHO these recommendations are for
 * 3. Metadata about the request (success, count, category filter)
 */
export interface RecommendationsResponse {
  success: boolean
  count: number
  category: string
  user: {
    follicleId: string
    budget?: number
  }
  recommendations: ProductMatchScore[]
}

//TODO clean this up gonna be duplication and un used code here
/**
 * MatchScore - Represents how well a product matches a specific user's hair profile
 *
 * This is the core data structure for product recommendations. It wraps a Product
 * with personalization data showing why it was recommended and how good the match is.
 */
export interface ProductMatchScore {
  product: Product
  totalScore: number
  breakdown: {
    ingredientScore: number
    engagementScore: number
  }
  matchReasons: string[]
  // New similarity data from engagmentScoring
  similarityMetrics?: {
    exact: number // Hair twins (100% match)
    veryHigh: number // 80-99% similar
    high: number // 60-80% similar
    medium: number // 40-60% similar
    totalSimilar: number // Total people similar enough to count
  }
  //Removed for now due to new follicleID focused system
  // allHairTypeScores: {
  //   straight: number
  //   wavy: number
  //   curly: number
  //   coily: number
  //   protective: number
  // }
}
