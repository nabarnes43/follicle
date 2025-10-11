import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { ProductInteraction, InteractionType } from '@/types/interaction'

/**
 * POST /api/interactions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId, follicleId, type } = body as {
      userId: string
      productId: string
      follicleId: string
      type: InteractionType
    }

    // Validation
    if (!userId || !productId || !follicleId || !type) {
      return NextResponse.json(
        {
          error: 'Missing required fields: userId, productId, follicleId, type',
        },
        { status: 400 }
      )
    }

    if (!['like', 'dislike', 'save', 'view'].includes(type)) {
      return NextResponse.json(
        {
          error:
            'Invalid interaction type. Must be: like, dislike, save, or view',
        },
        { status: 400 }
      )
    }

    // Check if interaction already exists (except for views - allow multiple)
    if (type !== 'view') {
      const existingInteraction = await adminDb
        .collection('interactions')
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .where('type', '==', type)
        .limit(1)
        .get()

      if (!existingInteraction.empty) {
        return NextResponse.json(
          { error: `You already ${type}d this product` },
          { status: 409 }
        )
      }
    }

    // Check for mutual exclusivity (like vs dislike)
    let oppositeType: InteractionType | null = null
    if (type === 'like') oppositeType = 'dislike'
    if (type === 'dislike') oppositeType = 'like'

    let oppositeInteractionDoc = null

    if (oppositeType) {
      const oppositeQuery = await adminDb
        .collection('interactions')
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .where('type', '==', oppositeType)
        .limit(1)
        .get()

      if (!oppositeQuery.empty) {
        oppositeInteractionDoc = oppositeQuery.docs[0]
      }
    }

    // Use batch write (Admin SDK doesn't have runTransaction the same way)
    const batch = adminDb.batch()

    // Delete opposite interaction if exists
    if (oppositeInteractionDoc) {
      batch.delete(oppositeInteractionDoc.ref)

      // Remove from user cache
      const userRef = adminDb.collection('users').doc(userId)
      if (oppositeType === 'like') {
        batch.update(userRef, {
          likedProducts: FieldValue.arrayRemove(productId),
        })
      } else if (oppositeType === 'dislike') {
        batch.update(userRef, {
          dislikedProducts: FieldValue.arrayRemove(productId),
        })
      }
    }

    // Create new interaction
    const newInteractionRef = adminDb.collection('interactions').doc()
    const interactionData: Omit<ProductInteraction, 'id'> = {
      userId,
      productId,
      follicleId,
      type,
      timestamp: FieldValue.serverTimestamp(),
    }

    batch.set(newInteractionRef, interactionData)

    // Update user cache
    const userRef = adminDb.collection('users').doc(userId)
    if (type === 'like') {
      batch.update(userRef, {
        likedProducts: FieldValue.arrayUnion(productId),
      })
    } else if (type === 'dislike') {
      batch.update(userRef, {
        dislikedProducts: FieldValue.arrayUnion(productId),
      })
    } else if (type === 'save') {
      batch.update(userRef, {
        savedProducts: FieldValue.arrayUnion(productId),
      })
    }

    // Commit batch
    await batch.commit()

    return NextResponse.json(
      {
        success: true,
        message: `Product ${type}d successfully`,
        interactionId: newInteractionRef.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create interaction. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/interactions
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const productId = searchParams.get('productId')
    const type = searchParams.get('type') as InteractionType

    // Validation
    if (!userId || !productId || !type) {
      return NextResponse.json(
        { error: 'Missing required query params: userId, productId, type' },
        { status: 400 }
      )
    }

    if (!['like', 'dislike', 'save', 'view'].includes(type)) {
      return NextResponse.json(
        {
          error:
            'Invalid interaction type. Must be: like, dislike, save, or view',
        },
        { status: 400 }
      )
    }

    // Find the interaction
    const interactionQuery = await adminDb
      .collection('interactions')
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .where('type', '==', type)
      .limit(1)
      .get()

    if (interactionQuery.empty) {
      return NextResponse.json(
        { error: `No ${type} interaction found for this product` },
        { status: 404 }
      )
    }

    const interactionDoc = interactionQuery.docs[0]

    // Use batch write
    const batch = adminDb.batch()

    // Delete interaction
    batch.delete(interactionDoc.ref)

    // Update user cache
    const userRef = adminDb.collection('users').doc(userId)
    if (type === 'like') {
      batch.update(userRef, {
        likedProducts: FieldValue.arrayRemove(productId),
      })
    } else if (type === 'dislike') {
      batch.update(userRef, {
        dislikedProducts: FieldValue.arrayRemove(productId),
      })
    } else if (type === 'save') {
      batch.update(userRef, {
        savedProducts: FieldValue.arrayRemove(productId),
      })
    }

    // Commit batch
    await batch.commit()

    return NextResponse.json(
      {
        success: true,
        message: `Product un-${type}d successfully`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting interaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete interaction. Please try again.' },
      { status: 500 }
    )
  }
}
