import { Routine } from '../../types/routine'
import { Product } from '../../types/product'
import { HairAnalysis } from '../../types/user'
import { RoutineMatchScore } from '../../types/routineMatching'
import { scoreRoutineProducts } from './routineProductScoring'
import { scoreRoutineByEngagement } from './routineEngagementScoring'
import { ROUTINE_ALGORITHM_WEIGHTS } from '../config/routineWeights'

/**
 * Score a single routine
 */
async function scoreRoutine(
  routine: Routine,
  hairAnalysis: HairAnalysis,
  follicleId: string,
  allProducts: Product[]
): Promise<RoutineMatchScore> {
  const matchReasons: string[] = []

  // 1. Product Score (10%)
  const productScore = await scoreRoutineProducts(
    routine,
    allProducts,
    hairAnalysis,
    follicleId
  )

  // 2. Engagement Score (90%)
  const {
    score: engagementScore,
    reasons: engagementReasons,
    interactionsByTier,
  } = await scoreRoutineByEngagement(routine, follicleId, true)

  matchReasons.push(...engagementReasons)

  // 3. Combine scores
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
    interactionsByTier,
  }
}

/**
 * Match routines for a user
 */
export async function matchRoutinesForUser(
  user: { hairAnalysis: HairAnalysis },
  routines: Routine[],
  follicleId: string,
  allProducts: Product[],
  options: { limit?: number } = {}
): Promise<RoutineMatchScore[]> {
  const { limit = 9999 } = options

  const scoredRoutines: RoutineMatchScore[] = []

  // Process all routines (small dataset, no batching needed)
  const scores = await Promise.all(
    routines.map((routine) =>
      scoreRoutine(routine, user.hairAnalysis, follicleId, allProducts)
    )
  )

  scoredRoutines.push(...scores)

  console.log(`Scored ${scoredRoutines.length} routines`)

  return scoredRoutines
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit)
}
