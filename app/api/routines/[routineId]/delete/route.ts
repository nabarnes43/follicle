import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { scoreProductForUser } from '@/functions/src/helpers/scoring'
import { removeProductInteractionsFromRoutine } from '@/lib/server/routineScores'

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

    // Remove from user's cache arrays
    const userRef = adminDb.collection('users').doc(userId)
    batch.update(userRef, {
      createdRoutines: FieldValue.arrayRemove(routineId),
      savedRoutines: FieldValue.arrayRemove(routineId),
      likedRoutines: FieldValue.arrayRemove(routineId),
      dislikedRoutines: FieldValue.arrayRemove(routineId),
      adaptedRoutines: FieldValue.arrayRemove(routineId),
    })

    await batch.commit()

    // Remove product interactions using shared function
    const productIds = (routine.steps || [])
      .map((s: any) => s.product_id)
      .filter(Boolean) as string[]

    await removeProductInteractionsFromRoutine(userId, routineId, productIds)

    // Rescore affected products (their engagement scores changed)
    const uniqueProductIds = [...new Set(productIds)]

    if (uniqueProductIds.length > 0) {
      console.log(
        `🔄 Rescoring ${uniqueProductIds.length} products after routine deletion...`
      )

      for (const productId of uniqueProductIds) {
        try {
          const productDoc = await adminDb
            .collection('products')
            .doc(productId)
            .get()
          if (productDoc.exists) {
            const product = { id: productDoc.id, ...productDoc.data() }
            await scoreProductForUser(userId, product as any, adminDb)
          }
        } catch (error) {
          console.error(`Failed to rescore product ${productId}:`, error)
          // Continue with other products
        }
      }

      console.log(`✅ Rescored ${uniqueProductIds.length} products`)
    }

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
