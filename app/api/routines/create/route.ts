import { NextRequest } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth' // ✅ Add this
import { Routine } from '@/types/routine'

/**
 * POST /api/routines
 * Creates a new routine (authenticated users only)
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Verify auth token first
    const userId = await verifyAuthToken(request)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const routine: Routine = await request.json()

    // Validate required fields (removed user_id check - we get it from token)
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

    // Generate ID if new routine
    const routineId = routine.id || adminDb.collection('routines').doc().id

    console.log(`💾 Saving routine: ${routine.name} (${routineId})`)

    // ✅ Use userId from verified token (can't be spoofed)
    await adminDb
      .collection('routines')
      .doc(routineId)
      .set({
        ...routine,
        id: routineId,
        user_id: userId, // ✅ Force verified userId from token
        updated_at: Timestamp.now(),
        created_at: Timestamp.now(),
        deleted_at: null,
      })

    console.log(`✅ Routine saved successfully: ${routineId}`)

    return Response.json({
      success: true,
      routineId,
      message: 'Routine saved successfully',
    })
  } catch (error) {
    console.error('Error saving routine:', error)
    return Response.json(
      {
        error: 'Failed to save routine',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
