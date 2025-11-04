// app/api/routines/[id]/route.ts

import { NextRequest } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { Routine } from '@/types/routine'

/**
 * GET /api/routines/[id]?userId={uid}
 * Fetches a single routine (public or owned by user)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routineId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') // Optional - for private routines

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

/**
 * PUT /api/routines/[id]
 * Updates an existing routine (owner only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routineId = params.id
    const updates = await request.json()

    if (!updates.user_id) {
      return Response.json(
        { error: 'Missing user_id in request' },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating routine: ${routineId}`)

    // Check ownership
    const doc = await adminDb.collection('routines').doc(routineId).get()

    if (!doc.exists) {
      return Response.json({ error: 'Routine not found' }, { status: 404 })
    }

    const existingRoutine = doc.data()

    if (existingRoutine?.user_id !== updates.user_id) {
      return Response.json(
        { error: 'Unauthorized - you do not own this routine' },
        { status: 403 }
      )
    }

    if (existingRoutine?.deleted_at) {
      return Response.json(
        { error: 'Cannot update deleted routine' },
        { status: 400 }
      )
    }

    // Update routine (preserve created_at, update updated_at)
    const { user_id, ...updateData } = updates // Don't allow changing user_id

    await adminDb
      .collection('routines')
      .doc(routineId)
      .update({
        ...updateData,
        updated_at: Timestamp.now(),
      })

    console.log(`✅ Routine updated: ${routineId}`)

    return Response.json({
      success: true,
      routineId,
      message: 'Routine updated successfully',
    })
  } catch (error) {
    console.error('Error updating routine:', error)
    return Response.json(
      {
        error: 'Failed to update routine',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/routines/[id]
 * Soft deletes a routine (sets deleted_at timestamp)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: routineId } = await params

    if (!routineId) {
      return Response.json(
        { error: 'Missing routineId parameter' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Soft deleting routine: ${routineId}`)

    // Soft delete by setting deleted_at timestamp
    await adminDb.collection('routines').doc(routineId).update({
      deleted_at: Timestamp.now(),
    })

    console.log(`✅ Routine soft deleted: ${routineId}`)

    return Response.json({
      success: true,
      message: 'Routine deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting routine:', error)
    return Response.json(
      {
        error: 'Failed to delete routine',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
