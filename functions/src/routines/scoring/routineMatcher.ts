import { Routine } from '../../types/routine'
import { Product } from '../../types/product'
import { RoutineMatchScore } from '../../types/routineMatching'
import { scoreRoutineProducts } from './routineProductScoring'
import { scoreRoutineByEngagement } from './routineEngagementScoring'
import { ROUTINE_ALGORITHM_WEIGHTS } from '../config/routineWeights'

/**
 * Score a single routine
 */
async function scoreRoutine(
  routine: Routine,
  follicleId: string,
  allProducts: Product[],
  db: FirebaseFirestore.Firestore
): Promise<RoutineMatchScore> {
  const matchReasons: string[] = []

  // 1. Product Score (10%)
  const productScore = await scoreRoutineProducts(
    routine,
    allProducts,
    follicleId,
    db
  )

  // 2. Engagement Score (90%)
  const {
    score: engagementScore,
    reasons: engagementReasons,
    interactionsByTier,
  } = await scoreRoutineByEngagement(routine, follicleId, true, db)

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
  routines: Routine[],
  follicleId: string,
  allProducts: Product[],
  db: FirebaseFirestore.Firestore,
): Promise<RoutineMatchScore[]> {

  const scoredRoutines: RoutineMatchScore[] = []

  // Process all routines (small dataset, no batching needed)
  const scores = await Promise.all(
    routines.map((routine) =>
      scoreRoutine(routine, follicleId, allProducts, db)
    )
  )

  scoredRoutines.push(...scores)

  console.log(`Scored ${scoredRoutines.length} routines`)

  return scoredRoutines
    .sort((a, b) => b.totalScore - a.totalScore)
}
