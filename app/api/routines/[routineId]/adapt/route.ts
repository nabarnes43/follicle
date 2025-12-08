import { NextRequest } from 'next/server'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { Routine } from '@/types/routine'
import { revalidateTag } from 'next/cache'
import { scoreRoutineForUser } from '@/functions/src/helpers/scoring'

/**
 * POST /api/routines/[routineId]/adapt
 * Creates an adapted copy of an existing routine
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { routineId: sourceRoutineId } = await params
    const adaptedRoutine: Routine = await request.json()

    // Validation
    if (!adaptedRoutine.follicle_id || !adaptedRoutine.name) {
      return Response.json(
        { error: 'Missing required fields: follicle_id or name' },
        { status: 400 }
      )
    }

    if (adaptedRoutine.steps.length === 0) {
      return Response.json(
        { error: 'Routine must have at least one step' },
        { status: 400 }
      )
    }

    const newRoutineId = adminDb.collection('routines').doc().id

    console.log(`🔄 Adapting routine: ${adaptedRoutine.name} (${newRoutineId})`)

    // Save adapted routine
    const routineToSave = {
      ...adaptedRoutine,
      id: newRoutineId,
      user_id: userId,
      adaptedFrom: sourceRoutineId,
      updated_at: Timestamp.now(),
      created_at: Timestamp.now(),
      deleted_at: null,
    }

    await adminDb.collection('routines').doc(newRoutineId).set(routineToSave)

    // Update user cache
    await adminDb
      .collection('users')
      .doc(userId)
      .update({
        adaptedRoutines: FieldValue.arrayUnion(newRoutineId),
      })

    // Track product interactions using batch writes
    const productIds = adaptedRoutine.steps
      .map((step) => step.product_id)
      .filter(Boolean)

    const uniqueProductIds = [...new Set(productIds)]

    if (uniqueProductIds.length > 0) {
      console.log(
        `📝 Tracking ${uniqueProductIds.length} product interactions...`
      )

      const interactionBatch = adminDb.batch()

      // Add interaction for each product
      uniqueProductIds.forEach((productId) => {
        const interactionRef = adminDb.collection('product_interactions').doc()
        interactionBatch.set(interactionRef, {
          userId,
          productId,
          follicleId: adaptedRoutine.follicle_id,
          type: 'routine',
          routineId: newRoutineId,
          timestamp: Timestamp.now(),
        })
      })

      // Update user cache (routineProducts array)
      const userRef = adminDb.collection('users').doc(userId)
      interactionBatch.update(userRef, {
        routineProducts: FieldValue.arrayUnion(...uniqueProductIds),
      })

      // Commit batch in background (don't block response)
      interactionBatch
        .commit()
        .then(() => {
          console.log(
            `✅ Tracked ${uniqueProductIds.length} product interactions`
          )
        })
        .catch((err) => {
          console.error('Failed to track product interactions:', err)
        })
    }

    // Track adapt interaction for source routine
    try {
      await adminDb
        .collection('routine_interactions')
        .add({
          userId,
          follicleId: adaptedRoutine.follicle_id,
          type: 'adapt',
          createdRoutineId: newRoutineId,
          timestamp: Timestamp.now(),
        })
    } catch (error) {
      console.error('Failed to track adapt interaction:', error)
    }

    // Score immediately for user
    try {
      console.log(`🚀 Scoring adapted routine immediately for user...`)
      await scoreRoutineForUser(userId, routineToSave as any, adminDb)
      console.log(`✅ Scored adapted routine immediately`)
    } catch (error) {
      console.error('Failed to score adapted routine immediately:', error)
      // Don't block - Cloud Function will retry
    }

    // Invalidate cache
    await Promise.all([
      revalidateTag(`user-routine-scores-${userId}`, 'max'),
      revalidateTag(`user-scores-${userId}`, 'max'),
    ])

    console.log(`✅ Routine adapted: ${newRoutineId}`)
    console.log(`🔄 Cache invalidated for user ${userId}`)

    return Response.json({
      success: true,
      routineId: newRoutineId,
      message: 'Routine adapted successfully',
    })
  } catch (error) {
    console.error('Error adapting routine:', error)
    return Response.json(
      {
        error: 'Failed to adapt routine',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
