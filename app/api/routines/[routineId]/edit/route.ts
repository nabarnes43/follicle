import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import {
  calculateRoutineProductDiff,
  removeProductInteractionsFromRoutine,
  trackProductInteractionsInRoutine,
  scoreRoutineAndInvalidateCache,
} from '@/lib/server/routineScores'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { routineId } = await params
    const updates = await request.json()

    console.log(`📝 Editing routine: ${routineId}`)

    // Get existing routine
    const routineRef = adminDb.collection('routines').doc(routineId)
    const routineDoc = await routineRef.get()

    if (!routineDoc.exists) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
    }

    const existingRoutine = routineDoc.data()!

    // Verify ownership
    if (existingRoutine.user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own routines' },
        { status: 403 }
      )
    }

    // Update routine
    await routineRef.update({
      ...updates,
      updated_at: Timestamp.now(),
    })

    console.log(`✅ Routine updated in Firestore: ${routineId}`)

    // Handle product interaction changes (if steps changed)
    if (updates.steps) {
      const { addedProducts, removedProducts } = calculateRoutineProductDiff(
        existingRoutine.steps || [],
        updates.steps
      )

      // Remove old interactions
      if (removedProducts.length > 0) {
        await removeProductInteractionsFromRoutine(
          userId,
          routineId,
          removedProducts
        )
      }

      // Add new interactions
      if (addedProducts.length > 0) {
        await trackProductInteractionsInRoutine(
          userId,
          routineId,
          addedProducts,
          existingRoutine.follicle_id
        )
      }
    }

    // Fetch updated routine for scoring
    const updatedRoutineDoc = await adminDb
      .collection('routines')
      .doc(routineId)
      .get()
    const updatedRoutine = {
      id: updatedRoutineDoc.id,
      ...updatedRoutineDoc.data(),
    }

    // Score immediately and invalidate cache
    await scoreRoutineAndInvalidateCache(userId, updatedRoutine as any)

    return NextResponse.json({
      success: true,
      message: 'Routine updated successfully',
    })
  } catch (error) {
    console.error('Error updating routine:', error)
    return NextResponse.json(
      { error: 'Failed to update routine' },
      { status: 500 }
    )
  }
}
