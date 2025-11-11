import { Routine } from '@/types/routine'
import { Product } from '@/types/product'
import { HairAnalysis } from '@/types/user'
import { RoutineMatchScore } from '@/types/routineMatching'
import { scoreRoutineProducts } from './scoring/routineProductScoring'
import { scoreRoutineByEngagement } from './scoring/routineEngagementScoring'
import { ROUTINE_ALGORITHM_WEIGHTS } from './config/routineWeights'

const BATCH_SIZE = 100 // Process 100 routines at a time

/**
 * Score a single routine
 * Combines product quality and community engagement
 */
async function scoreRoutine(
  routine: Routine,
  hairAnalysis: HairAnalysis,
  follicleId: string,
  allProducts: Product[]
): Promise<RoutineMatchScore> {
  const matchReasons: string[] = []

  // 1. Product Score (10%) - Quality of products in routine
  const productScore = await scoreRoutineProducts(
    routine,
    allProducts,
    hairAnalysis,
    follicleId
  )

  // 2. Engagement Score (90%) - Community validation
  const {
    score: engagementScore,
    reasons: engagementReasons,
    similarityMetrics,
  } = await scoreRoutineByEngagement(routine, follicleId, true)

  matchReasons.push(...engagementReasons)

  // 3. Combine scores using algorithm weights
  const totalScore =
    productScore * ROUTINE_ALGORITHM_WEIGHTS.product +
    engagementScore * ROUTINE_ALGORITHM_WEIGHTS.engagement

  return {
    routine,
    totalScore,
    breakdown: {
      productScore,
      engagementScore,
    },
    matchReasons,
    similarityMetrics,
  }
}

/**
 * Match routines for a user
 * Main entry point for routine matching
 *
 * @param user - User with hair analysis
 * @param routines - Routines to score
 * @param follicleId - User's follicle ID
 * @param allProducts - Full product database
 * @param options - Optional limit
 * @returns Scored and sorted routines
 */
export async function matchRoutinesForUser(
  user: { hairAnalysis: HairAnalysis },
  routines: Routine[],
  follicleId: string,
  allProducts: Product[],
  options: {
    limit?: number
  } = {}
): Promise<RoutineMatchScore[]> {
  const { limit = 9999 } = options

  // Score in batches to prevent Firestore overload
  const scoredRoutines: RoutineMatchScore[] = []

  for (let i = 0; i < routines.length; i += BATCH_SIZE) {
    const batch = routines.slice(i, i + BATCH_SIZE)

    // Process this batch in parallel
    const batchScores = await Promise.all(
      batch.map((routine) =>
        scoreRoutine(routine, user.hairAnalysis, follicleId, allProducts)
      )
    )

    scoredRoutines.push(...batchScores)

    // Log progress
    console.log(
      `Scored ${Math.min(i + BATCH_SIZE, routines.length)} / ${routines.length} routines`
    )
  }

  // Sort by total score (highest first) and limit
  return scoredRoutines
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit)
}
