import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { InteractionType } from '@/types/productInteraction'

/**
 * DELETE /api/interactions/products/[productId]/[type]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; type: string }> }
) {
  try {
    // ✅ Verify auth token
    const userId = await verifyAuthToken(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, type } = await params

    // Validation
    if (!productId || !type) {
      return NextResponse.json(
        { error: 'Missing required params: productId, type' },
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
      .collection('product_interactions')
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
