import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { InteractionType } from '@/types/productInteraction'
import { scoreProductForUser } from '@/functions/src/helpers/scoring'
import { invalidateUserScores } from '@/lib/server/cache'

// Only user-initiated interactions (not 'routine' - that's handled in routine creation)
const VALID_TYPES: InteractionType[] = ['like', 'dislike', 'save', 'view']

// Map interaction types to user cache field names
const CACHE_FIELD_MAP: Record<string, string> = {
  like: 'likedProducts',
  dislike: 'dislikedProducts',
  save: 'savedProducts',
}

/**
 * POST /api/interactions/products/[productId]/[type]
 * Create a product interaction (user-initiated only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; type: string }> }
) {
  try {
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

    if (!VALID_TYPES.includes(type as InteractionType)) {
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
        .collection('product_interactions')
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
    let oppositeType: string | null = null
    if (type === 'like') oppositeType = 'dislike'
    if (type === 'dislike') oppositeType = 'like'

    let oppositeInteractionDoc = null

    if (oppositeType) {
      const oppositeQuery = await adminDb
        .collection('product_interactions')
        .where('userId', '==', userId)
        .where('productId', '==', productId)
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
          [oppositeField]: FieldValue.arrayRemove(productId),
        })
      }
    }

    // Create new interaction
    const newInteractionRef = adminDb.collection('product_interactions').doc()
    batch.set(newInteractionRef, {
      userId,
      productId,
      follicleId,
      type,
      timestamp: FieldValue.serverTimestamp(),
    })

    // Update user cache (not for views)
    const cacheField = CACHE_FIELD_MAP[type]
    if (cacheField) {
      batch.update(userRef, {
        [cacheField]: FieldValue.arrayUnion(productId),
      })
    }

    await batch.commit()

    // Skip scoring for views (analytics only)
    if (type === 'view') {
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // Fetch product for scoring
    const productDoc = await adminDb.collection('products').doc(productId).get()

    if (!productDoc.exists) {
      console.warn(`Product ${productId} not found for scoring`)
      return NextResponse.json({ success: true }, { status: 201 })
    }

    const product = { id: productDoc.id, ...productDoc.data() }

    // Score immediately for this user
    try {
      await scoreProductForUser(userId, product as any, adminDb)
      console.log(`✅ Scored product ${productId} for user ${userId}`)
    } catch (error) {
      console.error(`Failed to score product ${productId}:`, error)
      // Don't block response - Cloud Function will rescore anyway
    }

    // Invalidate cache
    await invalidateUserScores(userId)

    return NextResponse.json(
      {
        success: true,
        message: `Product ${type}d successfully`,
        interactionId: newInteractionRef.id,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create interaction. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/interactions/products/[productId]/[type]
 * Remove a product interaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; type: string }> }
) {
  try {
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

    if (!VALID_TYPES.includes(type as InteractionType)) {
      return NextResponse.json(
        {
          error: `Invalid interaction type. Must be: ${VALID_TYPES.join(', ')}`,
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

    // Use batch write for atomic operations
    const batch = adminDb.batch()
    const userRef = adminDb.collection('users').doc(userId)

    // Delete interaction
    batch.delete(interactionDoc.ref)

    // Update user cache (not for views)
    const cacheField = CACHE_FIELD_MAP[type]
    if (cacheField) {
      batch.update(userRef, {
        [cacheField]: FieldValue.arrayRemove(productId),
      })
    }

    await batch.commit()

    // Skip scoring for views (analytics only)
    if (type === 'view') {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Fetch product for rescoring
    const productDoc = await adminDb.collection('products').doc(productId).get()

    if (!productDoc.exists) {
      console.warn(`Product ${productId} not found for scoring`)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const product = { id: productDoc.id, ...productDoc.data() }

    // Rescore after removing interaction
    try {
      await scoreProductForUser(userId, product as any, adminDb)
      console.log(`✅ Rescored product ${productId} for user ${userId}`)
    } catch (error) {
      console.error(`Failed to rescore product ${productId}:`, error)
    }

    // Invalidate cache
    await invalidateUserScores(userId)

    return NextResponse.json(
      {
        success: true,
        message: `Product un-${type}d successfully`,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete interaction. Please try again.' },
      { status: 500 }
    )
  }
}
