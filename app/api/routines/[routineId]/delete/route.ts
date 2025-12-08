import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { revalidateTag } from 'next/cache'

/**
 * DELETE /api/routines/[routineId]/delete
 * Soft delete a routine (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    // Verify auth
    const userId = await verifyAuthToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { routineId } = await params

    console.log(`🗑️ Deleting routine: ${routineId}`)

    // Get existing routine
    const routineRef = adminDb.collection('routines').doc(routineId)
    const routineDoc = await routineRef.get()

    if (!routineDoc.exists) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 })
    }

    const routine = routineDoc.data()

    // Verify ownership
    if (routine?.user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own routines' },
        { status: 403 }
      )
    }

    const batch = adminDb.batch()

    // Soft delete routine
    batch.update(routineRef, {
      deleted_at: FieldValue.serverTimestamp(),
    })

    // Remove 'routine' interactions for products in THIS routine only
    const productIds = (routine.steps || [])
      .map((s: any) => s.product_id)
      .filter(Boolean)

    for (const productId of productIds) {
      const interactionQuery = await adminDb
        .collection('product_interactions')
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .where('type', '==', 'routine')
        .where('routineId', '==', routineId)
        .get()

      // Delete all matching interactions
      interactionQuery.forEach((doc) => {
        batch.delete(doc.ref)
      })
    }

    // Remove from user's cache arrays
    const userRef = adminDb.collection('users').doc(userId)
    batch.update(userRef, {
      createdRoutines: FieldValue.arrayRemove(routineId), // NEW - also remove from createdRoutines
      savedRoutines: FieldValue.arrayRemove(routineId),
      likedRoutines: FieldValue.arrayRemove(routineId),
      dislikedRoutines: FieldValue.arrayRemove(routineId),
      adaptedRoutines: FieldValue.arrayRemove(routineId),
    })

    await batch.commit()

    // INVALIDATE CACHE
    await Promise.all([
      revalidateTag(`user-routine-scores-${userId}`, 'max'),
      revalidateTag(`user-scores-${userId}`, 'max'),
    ])

    console.log(`✅ Routine deleted: ${routineId}`)

    return NextResponse.json({
      success: true,
      message: 'Routine deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting routine:', error)
    return NextResponse.json(
      { error: 'Failed to delete routine' },
      { status: 500 }
    )
  }
}
