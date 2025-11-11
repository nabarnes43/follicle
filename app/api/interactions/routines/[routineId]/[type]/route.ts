import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { RoutineInteractionType } from '@/types/routineInteraction'

/**
 * DELETE /api/interactions/routines/[routineId]/[type]
 * Remove a routine interaction
 *
 * Path params: routineId, type
 * Auth: Required (userId from token)
 *
 * Removes interaction and updates user cache arrays
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string; type: string }> }
) {
  try {
    // Verify auth token
    const userId = await verifyAuthToken(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { routineId, type } = await params

    // Validation
    if (!routineId || !type) {
      return NextResponse.json(
        { error: 'Missing required path params: routineId, type' },
        { status: 400 }
      )
    }

    // Validate interaction type
    if (!['like', 'dislike', 'adapt', 'save', 'view'].includes(type)) {
      return NextResponse.json(
        {
          error:
            'Invalid interaction type. Must be: like, dislike, adapt, save, or view',
        },
        { status: 400 }
      )
    }

    // Find the interaction
    const interactionQuery = await adminDb
      .collection('routine_interactions')
      .where('userId', '==', userId)
      .where('routineId', '==', routineId)
      .where('type', '==', type)
      .limit(1)
      .get()

    if (interactionQuery.empty) {
      return NextResponse.json(
        { error: `No ${type} interaction found for this routine` },
        { status: 404 }
      )
    }

    const interactionDoc = interactionQuery.docs[0]

    // Use batch write for atomic operations
    const batch = adminDb.batch()

    // Delete interaction
    batch.delete(interactionDoc.ref)

    // Update user cache arrays
    const userRef = adminDb.collection('users').doc(userId)
    if (type === 'like') {
      batch.update(userRef, {
        likedRoutines: FieldValue.arrayRemove(routineId),
      })
    } else if (type === 'dislike') {
      batch.update(userRef, {
        dislikedRoutines: FieldValue.arrayRemove(routineId),
      })
    } else if (type === 'save') {
      batch.update(userRef, {
        savedRoutines: FieldValue.arrayRemove(routineId),
      })
    } else if (type === 'adapt') {
      batch.update(userRef, {
        adaptedRoutines: FieldValue.arrayRemove(routineId),
      })
    }

    // Commit batch
    await batch.commit()

    return NextResponse.json(
      {
        success: true,
        message: `Routine un-${type}d successfully`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting routine interaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete routine interaction. Please try again.' },
      { status: 500 }
    )
  }
}
