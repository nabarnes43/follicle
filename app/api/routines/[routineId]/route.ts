import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { Routine } from '@/types/routine'

/**
 * GET /api/routines/[routineId]
 * Fetches a single routine (public or owned by authenticated user)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const { routineId } = await params
    const userId = await verifyAuthToken(request)

    console.log(`📖 Fetching routine: ${routineId}`)

    const doc = await adminDb.collection('routines').doc(routineId).get()

    if (!doc.exists) {
      return Response.json({ error: 'Routine not found' }, { status: 404 })
    }

    const routine = { id: doc.id, ...doc.data() } as Routine

    // Check if deleted
    if (routine.deleted_at) {
      return Response.json({ error: 'Routine not found' }, { status: 404 })
    }

    // If public, return immediately
    if (routine.is_public) {
      console.log(`✅ Returning public routine: ${routine.name}`)
      return Response.json({ routine })
    }

    // If private, verify ownership
    if (!userId || userId !== routine.user_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    console.log(`✅ Returning private routine: ${routine.name}`)
    return Response.json({ routine })
  } catch (error) {
    console.error('Error fetching routine:', error)
    return Response.json(
      {
        error: 'Failed to fetch routine',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
