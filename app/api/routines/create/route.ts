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

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const routine: Routine = await request.json()

    // Validation
    if (!routine.follicle_id || !routine.name) {
      return Response.json(
        { error: 'Missing required fields: follicle_id or name' },
        { status: 400 }
      )
    }

    if (routine.steps.length === 0) {
      return Response.json(
        { error: 'Routine must have at least one step' },
        { status: 400 }
      )
    }

    const routineId = adminDb.collection('routines').doc().id

    console.log(`💾 Saving routine: ${routine.name} (${routineId})`)

    // Save routine
    const routineToSave = {
      ...routine,
      id: routineId,
      user_id: userId,
      updated_at: Timestamp.now(),
      created_at: Timestamp.now(),
      deleted_at: null,
    }

    await adminDb.collection('routines').doc(routineId).set(routineToSave)

    // Track product interactions using shared function
    const productIds = routineToSave.steps
      .map((step) => step.product_id)
      .filter(Boolean) as string[]

    await trackProductInteractionsInRoutine(
      userId,
      routineId,
      productIds,
      routineToSave.follicle_id
    )

    // Update user cache
    await updateUserRoutineCache(userId, routineId, 'create')

    // Score immediately and invalidate cache
    await scoreRoutineAndInvalidateCache(userId, routineToSave as any)

    console.log(`✅ Routine created: ${routineId}`)

    return Response.json({
      success: true,
      routineId,
      message: 'Routine created successfully',
    })
  } catch (error) {
    console.error('Error creating routine:', error)
    return Response.json(
      {
        error: 'Failed to create routine',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
