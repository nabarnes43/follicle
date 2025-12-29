// lib/server/routineScores.ts
import { adminDb } from '@/lib/firebase/admin'
import { PreComputedRoutineMatchScore } from '@/types/routineMatching'
import { Routine } from '@/types/routine'
import { FieldValue } from 'firebase-admin/firestore'
import { scoreRoutineForUser } from '@/functions/src/helpers/scoring'
import { serializeFirestoreDoc } from './serialization'

/**
 * Serialize routine for client component (converts Timestamps)
 */
export function serializeRoutine(routine: any): Routine {
  return serializeFirestoreDoc<Routine>(routine)
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
  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('routine_scores')
    .orderBy('score', 'desc')
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

  return scores.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
}

/**
 * Track product interactions when a routine is created/adapted/edited
 * Creates 'routine' type interactions for each product in the routine
 * Updates user's routineProducts cache array
 *
 * @param userId - The user creating/editing the routine
 * @param routineId - The routine ID
 * @param productIds - Array of product IDs in the routine
 * @param follicleId - User's follicleId
 * @returns Promise that resolves when interactions are tracked
 */
export async function trackProductInteractionsInRoutine(
  userId: string,
  routineId: string,
  productIds: string[],
  follicleId: string
): Promise<void> {
  const uniqueProductIds = [...new Set(productIds)]

  if (uniqueProductIds.length === 0) {
    console.log('No products to track for routine', routineId)
    return
  }

  console.log(
    `📝 Tracking ${uniqueProductIds.length} product interactions for routine ${routineId}...`
  )

  const interactionBatch = adminDb.batch()

  // Add interaction for each product
  uniqueProductIds.forEach((productId) => {
    const interactionRef = adminDb.collection('product_interactions').doc()
    interactionBatch.set(interactionRef, {
      userId,
      productId,
      follicleId,
      type: 'routine',
      routineId: routineId,
      timestamp: FieldValue.serverTimestamp(),
    })
  })

  // Update user cache (routineProducts array)
  const userRef = adminDb.collection('users').doc(userId)
  interactionBatch.update(userRef, {
    routineProducts: FieldValue.arrayUnion(...uniqueProductIds),
  })

  await interactionBatch.commit()

  console.log(
    `✅ Tracked ${uniqueProductIds.length} product interactions for routine ${routineId}`
  )
}

/**
 * Remove product interactions when routine is edited (products removed)
 * Deletes 'routine' type interactions for removed products
 * Updates user's routineProducts cache array
 *
 * @param userId - The user editing the routine
 * @param routineId - The routine ID
 * @param productIds - Array of product IDs to remove
 * @returns Promise that resolves when interactions are removed
 */
export async function removeProductInteractionsFromRoutine(
  userId: string,
  routineId: string,
  productIds: string[]
): Promise<void> {
  if (productIds.length === 0) {
    return
  }

  console.log(
    `🗑️ Removing ${productIds.length} product interactions for routine ${routineId}...`
  )

  const batch = adminDb.batch()

  // Remove interactions for each product
  for (const productId of productIds) {
    const interactionQuery = await adminDb
      .collection('product_interactions')
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .where('type', '==', 'routine')
      .where('routineId', '==', routineId)
      .get()

    interactionQuery.forEach((doc) => {
      batch.delete(doc.ref)
    })
  }

  // Update user cache
  const userRef = adminDb.collection('users').doc(userId)
  batch.update(userRef, {
    routineProducts: FieldValue.arrayRemove(...productIds),
  })

  await batch.commit()

  console.log(
    `✅ Removed ${productIds.length} product interactions for routine ${routineId}`
  )
}

/**
 * Score a routine immediately for the user and invalidate caches
 * This ensures user sees updated scores right away
 *
 * @param userId - The user to score for
 * @param routine - The routine to score (must include steps)
 * @returns Promise that resolves when scoring and cache invalidation complete
 */
export async function scoreRoutineAndInvalidateCache(
  userId: string,
  routine: Routine
): Promise<void> {
  try {
    console.log(
      `🚀 Scoring routine ${routine.id} immediately for user ${userId}...`
    )
    await scoreRoutineForUser(userId, routine as any, adminDb)
    console.log(`✅ Scored routine ${routine.id} immediately`)
  } catch (error) {
    console.error(`Failed to score routine ${routine.id}:`, error)
    // Don't throw - Cloud Function will retry scoring in background
  }
}

/**
 * Update user's routine cache arrays based on operation type
 *
 * @param userId - The user ID
 * @param routineId - The routine ID
 * @param operation - Type of operation: 'create' | 'adapt'
 * @returns Promise that resolves when cache is updated
 */
export async function updateUserRoutineCache(
  userId: string,
  routineId: string,
  operation: 'create' | 'adapt'
): Promise<void> {
  const userRef = adminDb.collection('users').doc(userId)

  if (operation === 'create') {
    await userRef.update({
      createdRoutines: FieldValue.arrayUnion(routineId),
    })
    console.log(`✅ Added ${routineId} to user's createdRoutines`)
  } else if (operation === 'adapt') {
    await userRef.update({
      adaptedRoutines: FieldValue.arrayUnion(routineId),
    })
    console.log(`✅ Added ${routineId} to user's adaptedRoutines`)
  }
}

/**
 * Calculate product diff between old and new routine steps
 * Returns products that were added and removed
 *
 * @param oldSteps - Original routine steps
 * @param newSteps - Updated routine steps
 * @returns Object with addedProducts and removedProducts arrays
 */
export function calculateRoutineProductDiff(
  oldSteps: Array<{ product_id?: string | null }>,
  newSteps: Array<{ product_id?: string | null }>
): {
  addedProducts: string[]
  removedProducts: string[]
} {
  const oldProductIds = oldSteps
    .map((s) => s.product_id)
    .filter((id): id is string => !!id)

  const newProductIds = newSteps
    .map((s) => s.product_id)
    .filter((id): id is string => !!id)

  const oldSet = new Set(oldProductIds)
  const newSet = new Set(newProductIds)

  const removedProducts = oldProductIds.filter((id) => !newSet.has(id))
  const addedProducts = newProductIds.filter((id) => !oldSet.has(id))

  return { addedProducts, removedProducts }
}
