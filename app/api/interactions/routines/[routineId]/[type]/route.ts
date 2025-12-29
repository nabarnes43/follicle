import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { RoutineInteractionType } from '@/types/routineInteraction'
import { scoreRoutineForUser } from '@/functions/src/helpers/scoring'
import {
  createInteraction,
  deleteInteraction,
  interactionExists,
} from '@/lib/server/interactions'

// Only user-initiated interactions
const VALID_TYPES: RoutineInteractionType[] = [
  'like',
  'dislike',
  'save',
  'view',
]

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

    const exists = await interactionExists(userId, routineId, 'routine', type)

    if (exists) {
      console.log(`Interaction already exists: ${type} on routine ${routineId}`)
      return NextResponse.json(
        {
          success: true,
          message: `Already ${type}d`,
          cached: true,
        },
        { status: 208 }
      )
    }

    // Create interaction (handles mutual exclusivity and cache updates)
    const interactionId = await createInteraction(
      userId,
      routineId,
      'routine',
      type,
      follicleId
    )

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

    return NextResponse.json(
      {
        success: true,
        message: `Routine ${type}d successfully`,
        interactionId,
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

    // Delete interaction (handles cache updates)
    const deleted = await deleteInteraction(userId, routineId, 'routine', type)

    if (!deleted) {
      return NextResponse.json(
        { error: `No ${type} interaction found for this routine` },
        { status: 404 }
      )
    }

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
