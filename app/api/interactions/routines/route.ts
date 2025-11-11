import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { FieldValue } from 'firebase-admin/firestore'
import {
  RoutineInteraction,
  RoutineInteractionType,
} from '@/types/routineInteraction'

/**
 * POST /api/routine-interactions
 * Create a new routine interaction (like, dislike, adapt, save, view)
 *
 * Body: { routineId, follicleId, type }
 * Auth: Required (userId from token)
 *
 * Behaviors:
 * - Like/Dislike are mutually exclusive (creating one removes the other)
 * - Adapt/Save/View can coexist with Like/Dislike
 * - Views allow multiple instances (tracking)
 * - Updates user cache arrays (likedRoutines, savedRoutines, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify auth token
    const userId = await verifyAuthToken(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { routineId, follicleId, type } = body as {
      routineId: string
      follicleId: string
      type: RoutineInteractionType
    }

    // Validation
    if (!routineId || !follicleId || !type) {
      return NextResponse.json(
        {
          error: 'Missing required fields: routineId, follicleId, type',
        },
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

    // Check if interaction already exists (except for views - allow multiple)
    if (type !== 'view') {
      const existingInteraction = await adminDb
        .collection('routine_interactions')
        .where('userId', '==', userId)
        .where('routineId', '==', routineId)
        .where('type', '==', type)
        .limit(1)
        .get()

      if (!existingInteraction.empty) {
        return NextResponse.json(
          { error: `You already ${type}d this routine` },
          { status: 409 }
        )
      }
    }

    // Check for mutual exclusivity (like vs dislike)
    let oppositeType: RoutineInteractionType | null = null
    if (type === 'like') oppositeType = 'dislike'
    if (type === 'dislike') oppositeType = 'like'

    let oppositeInteractionDoc = null

    if (oppositeType) {
      const oppositeQuery = await adminDb
        .collection('routine_interactions')
        .where('userId', '==', userId)
        .where('routineId', '==', routineId)
        .where('type', '==', oppositeType)
        .limit(1)
        .get()

      if (!oppositeQuery.empty) {
        oppositeInteractionDoc = oppositeQuery.docs[0]
      }
    }

    // Use batch write for atomic operations
    const batch = adminDb.batch()

    // Delete opposite interaction if exists (like/dislike mutual exclusivity)
    if (oppositeInteractionDoc) {
      batch.delete(oppositeInteractionDoc.ref)

      // Remove from user cache
      const userRef = adminDb.collection('users').doc(userId)
      if (oppositeType === 'like') {
        batch.update(userRef, {
          likedRoutines: FieldValue.arrayRemove(routineId),
        })
      } else if (oppositeType === 'dislike') {
        batch.update(userRef, {
          dislikedRoutines: FieldValue.arrayRemove(routineId),
        })
      }
    }

    // Create new interaction
    const newInteractionRef = adminDb.collection('routine_interactions').doc()
    const interactionData: Omit<RoutineInteraction, 'id'> = {
      userId,
      routineId,
      follicleId,
      type,
      timestamp: FieldValue.serverTimestamp(),
    }

    batch.set(newInteractionRef, interactionData)

    // Update user cache arrays for fast UI checks
    const userRef = adminDb.collection('users').doc(userId)
    if (type === 'like') {
      batch.update(userRef, {
        likedRoutines: FieldValue.arrayUnion(routineId),
      })
    } else if (type === 'dislike') {
      batch.update(userRef, {
        dislikedRoutines: FieldValue.arrayUnion(routineId),
      })
    } else if (type === 'save') {
      batch.update(userRef, {
        savedRoutines: FieldValue.arrayUnion(routineId),
      })
    } else if (type === 'adapt') {
      batch.update(userRef, {
        adaptedRoutines: FieldValue.arrayUnion(routineId),
      })
    }

    // Commit batch
    await batch.commit()

    return NextResponse.json(
      {
        success: true,
        message: `Routine ${type}d successfully`,
        interactionId: newInteractionRef.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating routine interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create routine interaction. Please try again.' },
      { status: 500 }
    )
  }
}


