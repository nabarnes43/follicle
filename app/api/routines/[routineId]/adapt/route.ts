import { NextRequest } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { Routine } from '@/types/routine'
import {
  trackProductInteractionsInRoutine,
  scoreRoutineAndInvalidateCache,
  updateUserRoutineCache,
} from '@/lib/server/routineScores'

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

    // Track product interactions using shared function
    const productIds = routineToSave.steps
      .map((step) => step.product_id)
      .filter(Boolean) as string[]

    await trackProductInteractionsInRoutine(
      userId,
      newRoutineId,
      productIds,
      routineToSave.follicle_id
    )

    // Track adapt interaction for source routine
    try {
      await adminDb.collection('routine_interactions').add({
        userId,
        follicleId: adaptedRoutine.follicle_id,
        type: 'adapt',
        createdRoutineId: newRoutineId,
        timestamp: Timestamp.now(),
      })
    } catch (error) {
      console.error('Failed to track adapt interaction:', error)
    }

    // Update user cache
    await updateUserRoutineCache(userId, newRoutineId, 'adapt')

    // Score immediately and invalidate cache
    await scoreRoutineAndInvalidateCache(userId, routineToSave as any)

    console.log(`✅ Routine adapted: ${newRoutineId}`)

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
