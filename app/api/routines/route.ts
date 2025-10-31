import { NextRequest } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { Routine } from '@/types/routine'

/**
 * POST /api/routines
 * Creates a new routine
 */
export async function POST(request: NextRequest) {
  try {
    const routine: Routine = await request.json()

    // Validate required fields
    if (!routine.user_id || !routine.follicle_id || !routine.name) {
      return Response.json(
        { error: 'Missing required fields: user_id, follicle_id, or name' },
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

    // Use Admin SDK to write to Firestore
    await adminDb
      .collection('routines')
      .doc(routineId)
      .set({
        ...routine,
        id: routineId,
        updated_at: Timestamp.now(),
        created_at: Timestamp.now(),
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
