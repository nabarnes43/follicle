// functions/src/types/productMatching.ts
import { Product } from './product'

export interface RecommendationsResponse {
  success: boolean
  count: number
  category: string
  user: {
    follicleId: string
  }
  recommendations: ProductMatchScore[]
}

export interface ProductMatchScore {
  product: Product
  totalScore: number
  breakdown: {
    ingredientScore: number
    engagementScore: number
  }
  matchReasons: string[]
  interactionsByTier?: {
    exact: { routine: number; save: number; like: number }
    veryHigh: { routine: number; save: number; like: number }
    high: { routine: number; save: number; like: number }
    medium: { routine: number; save: number; like: number }
  }
}
