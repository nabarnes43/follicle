// app/api/routines/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { Routine } from '@/types/routine'

/**
 * GET /api/routines/[id]
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

/**
 * PATCH /api/routines/[routineId]
 * Update an existing routine
 */
export async function PATCH(
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
    const updates = await request.json()

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
        { error: 'You can only edit your own routines' },
        { status: 403 }
      )
    }

    // Handle product interaction cleanup
    const oldSteps = routine.steps || []
    const newSteps = updates.steps || oldSteps

    const oldProductIds = new Set(
      oldSteps.map((s: any) => s.product_id).filter(Boolean)
    )
    const newProductIds = new Set(
      newSteps.map((s: any) => s.product_id).filter(Boolean)
    )

    // Find products that were removed
    const removedProductIds = [...oldProductIds].filter(
      (id) => !newProductIds.has(id)
    )

    const batch = adminDb.batch()

    // Delete 'routine' interactions for removed products (filtered by routineId)
    for (const productId of removedProductIds) {
      const interactionQuery = await adminDb
        .collection('product_interactions')
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .where('type', '==', 'routine')
        .where('routineId', '==', routineId) // NEW - only delete THIS routine's interaction
        .limit(1)
        .get()

      if (!interactionQuery.empty) {
        batch.delete(interactionQuery.docs[0].ref)
      }
    }

    // Add 'routine' interactions for newly added products
    const addedProductIds = [...newProductIds].filter(
      (id) => !oldProductIds.has(id)
    )

    for (const productId of addedProductIds) {
      // Check if interaction already exists
      const existingInteraction = await adminDb
        .collection('product_interactions')
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .where('type', '==', 'routine')
        .where('routineId', '==', routineId)
        .limit(1)
        .get()

      if (existingInteraction.empty) {
        // Create new interaction
        const newInteractionRef = adminDb
          .collection('product_interactions')
          .doc()
        batch.set(newInteractionRef, {
          userId,
          productId,
          follicleId: routine.follicle_id,
          type: 'routine',
          routineId,
          timestamp: FieldValue.serverTimestamp(),
        })

        // Update user cache
        const userRef = adminDb.collection('users').doc(userId)
        batch.update(userRef, {
          routineProducts: FieldValue.arrayUnion(productId),
        })
      }
    }

    // Update routine
    batch.update(routineRef, {
      ...updates,
      updated_at: FieldValue.serverTimestamp(),
    })

    await batch.commit()

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

/**
 * PUT /api/routines/[id]
 * Updates an existing routine (owner only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const { routineId } = await params
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
 * DELETE /api/routines/[routineId]
 * Soft delete a routine
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

    // Remove 'routine' interactions for products in THIS routine only
    const productIds = (routine.steps || [])
      .map((s: any) => s.product_id)
      .filter(Boolean)

    for (const productId of productIds) {
      const interactionQuery = await adminDb
        .collection('product_interactions')
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .where('type', '==', 'routine')
        .where('routineId', '==', routineId) // NEW - only delete THIS routine's interaction
        .get()

      // Delete all matching interactions (there should only be one)
      interactionQuery.forEach((doc) => {
        batch.delete(doc.ref)
      })
    }

    // Remove from user's cache arrays
    const userRef = adminDb.collection('users').doc(userId)
    batch.update(userRef, {
      savedRoutines: FieldValue.arrayRemove(routineId),
      likedRoutines: FieldValue.arrayRemove(routineId),
      dislikedRoutines: FieldValue.arrayRemove(routineId),
      adaptedRoutines: FieldValue.arrayRemove(routineId),
    })

    await batch.commit()

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
