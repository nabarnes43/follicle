import { Routine } from './routine'

export interface PreComputedRoutineStep {
  order: number
  stepName: string
  productId: string
  productName: string | null
  productBrand: string | null
  productImageUrl: string | null
}

export interface PreComputedRoutineMatchScore {
  routine: {
    id: string
    name: string
    stepCount: number
    frequency: {
      interval: number
      unit: 'day' | 'week' | 'month'
    }
    isPublic: boolean
    userId: string
    steps: PreComputedRoutineStep[]
  }
  totalScore: number
  breakdown: {
    productScore: number
    engagementScore: number
  }
  matchReasons: string[]
}

/**
 * RoutineMatchScore - Represents how well a routine matches a specific user's hair profile
 *
 * Similar to MatchScore for products, but for routines
 * Combines product quality (10%) and community engagement (90%)
 */
export interface RoutineMatchScore {
  routine: Routine
  totalScore: number
  breakdown: {
    productScore: number // 10% - Aggregated product quality
    engagementScore: number // 90% - Community validation
  }
  matchReasons: string[]
  similarityMetrics?: {
    exact: number // Users with identical hair
    veryHigh: number // 80-99% similar
    high: number // 60-80% similar
    medium: number // 40-60% similar
    totalSimilar: number // Total people similar enough to count
  }
}
