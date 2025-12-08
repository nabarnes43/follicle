import { adminDb } from '@/lib/firebase/admin'
import { PreComputedRoutineMatchScore } from '@/types/routineMatching'
import { Routine } from '@/types/routine'
import { cacheTag } from 'next/cache'

/**
 * Convert Firestore Timestamp to Date (serializable)
 */
function toDate(ts: any): Date | null {
  if (!ts) return null
  if (ts._seconds !== undefined) return new Date(ts._seconds * 1000)
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000)
  if (ts instanceof Date) return ts
  return null
}

/**
 * Serialize routine for client component (converts Timestamps)
 */
export function serializeRoutine(routine: any): Routine {
  return {
    ...routine,
    created_at: toDate(routine.created_at),
    updated_at: toDate(routine.updated_at),
    deleted_at: toDate(routine.deleted_at),
  }
}

/**
 * Transform Firestore doc to PreComputedRoutineMatchScore (serialized)
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
 * Get all routine scores for a user (cached, serialized)
 */
export async function getCachedAllRoutineScores(userId: string) {
  'use cache'
  cacheTag(`user-routine-scores-${userId}`)

  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('routine_scores')
    .orderBy('score', 'desc') // CHANGED: from orderBy('rank')
    .get()

  return snapshot.docs.map(docToScore)
}

/**
 * Get routine scores for specific routine IDs (cached, serialized)
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
