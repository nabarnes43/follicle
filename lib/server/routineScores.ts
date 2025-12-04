import { adminDb } from '@/lib/firebase/admin'
import { PreComputedRoutineMatchScore } from '@/types/routineMatching'
import { cacheTag } from 'next/cache'


/**
 * Transform Firestore doc to PreComputedRoutineMatchScore
 */
function docToScore(
  doc: FirebaseFirestore.QueryDocumentSnapshot
): PreComputedRoutineMatchScore {
  const data = doc.data()
  return {
    routine: {
      id: doc.id,
      name: data.routineName,
      stepCount: data.routineStepCount,
      frequency: data.routineFrequency,
      userId: data.routineUserId,
      isPublic: data.routineIsPublic,
      steps: data.routineSteps,
    },
    totalScore: data.score,
    breakdown: data.breakdown,
    matchReasons: data.matchReasons || [],
  }
}

/**
 * Get all routine scores for a user (cached)
 */
export async function getCachedAllRoutineScores(userId: string) {
  'use cache'
  cacheTag(`user-routine-scores-${userId}`)

  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('routine_scores')
    .orderBy('rank')
    .get()

  return snapshot.docs.map(docToScore)
}

/**
 * Get routine scores for specific routine IDs (cached)
 */
export async function getCachedRoutineScoresByIds(
  userId: string,
  routineIds: string[]
) {
  'use cache'
  cacheTag(`user-routine-scores-${userId}`)

  if (routineIds.length === 0) return []

  const scores: PreComputedRoutineMatchScore[] = []

  for (const routineId of routineIds) {
    const doc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('routine_scores')
      .doc(routineId)
      .get()

    if (doc.exists) {
      const data = doc.data()!
      scores.push({
        routine: {
          id: doc.id,
          name: data.routineName,
          stepCount: data.routineStepCount,
          frequency: data.routineFrequency,
          userId: data.routineUserId,
          isPublic: data.routineIsPublic,
          steps: data.routineSteps || [],
        },
        totalScore: data.score,
        breakdown: data.breakdown,
        matchReasons: data.matchReasons || [],
      })
    }
  }

  return scores.sort((a, b) => b.totalScore - a.totalScore)
}

/**
 * Convert Firestore Timestamp to milliseconds (serializable)
 */
function toTimestamp(ts: any): number | null {
  if (!ts) return null
  if (ts._seconds) return ts._seconds * 1000
  if (ts.seconds) return ts.seconds * 1000
  if (ts instanceof Date) return ts.getTime()
  return null
}

/**
 * Serialize routine for client component (converts Timestamps)
 */
export function serializeRoutine(routine: any): any {
  return {
    ...routine,
    created_at: toTimestamp(routine.created_at),
    updated_at: toTimestamp(routine.updated_at),
    deleted_at: toTimestamp(routine.deleted_at),
  }
}
