import { Product } from './product'

/**
 * MatchScore - Represents how well a product matches a specific user's hair profile
 * 
 * This is the core data structure for product recommendations. It wraps a Product
 * with personalization data showing why it was recommended and how good the match is.
 */
export interface MatchScore {
  product: Product
  totalScore: number
  breakdown: {
    ingredientScore: number
    engagementScore: number
  }
  matchReasons: string[]
  allHairTypeScores: {
    straight: number
    wavy: number
    curly: number
    coily: number
    protective: number
  }
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
    hairType: string
    budget?: number
  }
  recommendations: MatchScore[]
}
