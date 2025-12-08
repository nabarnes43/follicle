import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { revalidateTag } from 'next/cache'
import { scoreRoutineForUser } from '@/functions/src/helpers/scoring'

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

    // Prepare batch for atomic updates
    const batch = adminDb.batch()

    // Update routine
    batch.update(routineRef, {
      ...updates,
      updated_at: Timestamp.now(),
    })

    // Handle product interaction changes (if steps changed)
    if (updates.steps) {
      const oldProductIds = (existingRoutine.steps || [])
        .map((s: any) => s.product_id)
        .filter(Boolean)

      const newProductIds = updates.steps
        .map((s: any) => s.product_id)
        .filter(Boolean)

      const oldSet = new Set(oldProductIds)
      const newSet = new Set(newProductIds)

      // Products removed from routine
      const removedProducts = oldProductIds.filter(
        (id: string) => !newSet.has(id)
      )

      // Products added to routine
      const addedProducts = newProductIds.filter(
        (id: string) => !oldSet.has(id)
      )

      // Remove old interactions
      for (const productId of removedProducts) {
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

      // Add new interactions
      for (const productId of addedProducts) {
        const interactionRef = adminDb.collection('product_interactions').doc()
        batch.set(interactionRef, {
          userId,
          productId,
          follicleId: existingRoutine.follicle_id,
          type: 'routine',
          routineId: routineId,
          timestamp: Timestamp.now(),
        })
      }

      // Update user cache
      if (removedProducts.length > 0) {
        batch.update(adminDb.collection('users').doc(userId), {
          routineProducts: FieldValue.arrayRemove(...removedProducts),
        })
      }

      if (addedProducts.length > 0) {
        batch.update(adminDb.collection('users').doc(userId), {
          routineProducts: FieldValue.arrayUnion(...addedProducts),
        })
      }
    }

    // Commit all changes
    await batch.commit()

    console.log(`✅ Routine updated in Firestore: ${routineId}`)

    // Score immediately for user
    try {
      console.log(`🚀 Scoring updated routine immediately for user...`)

      const updatedRoutineDoc = await adminDb
        .collection('routines')
        .doc(routineId)
        .get()
      const updatedRoutine = {
        id: updatedRoutineDoc.id,
        ...updatedRoutineDoc.data(),
      }

      await scoreRoutineForUser(userId, updatedRoutine as any, adminDb)
      console.log(`✅ Scored updated routine immediately`)
    } catch (error) {
      console.error('Failed to score routine immediately:', error)
      // Don't block - Cloud Function will retry
    }

    // Invalidate cache IMMEDIATELY after
    await Promise.all([
      revalidateTag(`user-routine-scores-${userId}`, 'max'),
      revalidateTag(`user-scores-${userId}`, 'max'),
    ])

    console.log(`🔄 Cache invalidated for user ${userId}`)

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
