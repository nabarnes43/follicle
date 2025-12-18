import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { RoutineInteractionType } from '@/types/routineInteraction'
import { scoreRoutineForUser } from '@/functions/src/helpers/scoring'
import { invalidateUserScores } from '@/lib/server/cache'

// Only user-initiated interactions
const VALID_TYPES: RoutineInteractionType[] = [
  'like',
  'dislike',
  'save',
  'view',
]

// Map interaction types to user cache field names
const CACHE_FIELD_MAP: Record<string, string> = {
  like: 'likedRoutines',
  dislike: 'dislikedRoutines',
  save: 'savedRoutines',
}

/**
 * POST /api/interactions/routines/[routineId]/[type]
 * Create a routine interaction (user-initiated only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string; type: string }> }
) {
  try {
    const userId = await verifyAuthToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { routineId, type } = await params

    // Validation
    if (!routineId || !type) {
      return NextResponse.json(
        { error: 'Missing required params: routineId, type' },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type as RoutineInteractionType)) {
      return NextResponse.json(
        {
          error: `Invalid interaction type. Must be: ${VALID_TYPES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Get user's follicleId
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const follicleId = userDoc.data()?.follicleId || ''

    // Views allow multiple, others don't
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
    let oppositeType: string | null = null
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
    const userRef = adminDb.collection('users').doc(userId)

    // Delete opposite interaction if exists (like/dislike mutual exclusivity)
    if (oppositeInteractionDoc && oppositeType) {
      batch.delete(oppositeInteractionDoc.ref)

      // Remove from user cache
      const oppositeField = CACHE_FIELD_MAP[oppositeType]
      if (oppositeField) {
        batch.update(userRef, {
          [oppositeField]: FieldValue.arrayRemove(routineId),
        })
      }
    }

    // Create new interaction
    const newInteractionRef = adminDb.collection('routine_interactions').doc()
    batch.set(newInteractionRef, {
      userId,
      routineId,
      follicleId,
      type,
      timestamp: FieldValue.serverTimestamp(),
    })

    // Update user cache (not for views)
    const cacheField = CACHE_FIELD_MAP[type]
    if (cacheField) {
      batch.update(userRef, {
        [cacheField]: FieldValue.arrayUnion(routineId),
      })
    }

    await batch.commit()

    // Skip scoring for views (analytics only)
    if (type === 'view') {
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // Fetch routine for scoring
    const routineDoc = await adminDb.collection('routines').doc(routineId).get()

    if (!routineDoc.exists) {
      console.warn(`Routine ${routineId} not found for scoring`)
      return NextResponse.json({ success: true }, { status: 201 })
    }

    const routine = { id: routineDoc.id, ...routineDoc.data() }

    // Score immediately for this user
    try {
      await scoreRoutineForUser(userId, routine as any, adminDb)
      console.log(`✅ Scored routine ${routineId} for user ${userId}`)
    } catch (error) {
      console.error(`Failed to score routine ${routineId}:`, error)
      // Don't block response - Cloud Function will rescore anyway
    }

    // Invalidate cache
    await invalidateUserScores(userId)

    return NextResponse.json(
      {
        success: true,
        message: `Routine ${type}d successfully`,
        interactionId: newInteractionRef.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating routine interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create routine interaction. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/interactions/routines/[routineId]/[type]
 * Remove a routine interaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string; type: string }> }
) {
  try {
    const userId = await verifyAuthToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { routineId, type } = await params

    // Validation
    if (!routineId || !type) {
      return NextResponse.json(
        { error: 'Missing required params: routineId, type' },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type as RoutineInteractionType)) {
      return NextResponse.json(
        {
          error: `Invalid interaction type. Must be: ${VALID_TYPES.join(', ')}`,
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
    const userRef = adminDb.collection('users').doc(userId)

    // Delete interaction
    batch.delete(interactionDoc.ref)

    // Update user cache (not for views)
    const cacheField = CACHE_FIELD_MAP[type]
    if (cacheField) {
      batch.update(userRef, {
        [cacheField]: FieldValue.arrayRemove(routineId),
      })
    }

    await batch.commit()

    // Skip scoring for views (analytics only)
    if (type === 'view') {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Fetch routine for rescoring
    const routineDoc = await adminDb.collection('routines').doc(routineId).get()

    if (!routineDoc.exists) {
      console.warn(`Routine ${routineId} not found for scoring`)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const routine = { id: routineDoc.id, ...routineDoc.data() }

    // Rescore after removing interaction
    try {
      await scoreRoutineForUser(userId, routine as any, adminDb)
      console.log(`✅ Rescored routine ${routineId} for user ${userId}`)
    } catch (error) {
      console.error(`Failed to rescore routine ${routineId}:`, error)
    }

    // Invalidate cache
    await invalidateUserScores(userId)
    return NextResponse.json(
      {
        success: true,
        message: `Routine un-${type}d successfully`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error deleting routine interaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete routine interaction. Please try again.' },
      { status: 500 }
    )
  }
}
