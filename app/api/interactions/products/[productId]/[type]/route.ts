import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { InteractionType } from '@/types/productInteraction'
import { scoreProductForUser } from '@/functions/src/helpers/scoring'
import {
  createInteraction,
  deleteInteraction,
  interactionExists,
} from '@/lib/server/interactions'

// Only user-initiated interactions (not 'routine' - that's handled in routine creation)
const VALID_TYPES: InteractionType[] = ['like', 'dislike', 'save', 'view']

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

    const exists = await interactionExists(userId, productId, 'product', type)
    if (exists) {
      console.log(`Interaction already exists: ${type} on product ${productId}`)
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
      productId,
      'product',
      type,
      follicleId
    )

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

    return NextResponse.json(
      {
        success: true,
        message: `Product ${type}d successfully`,
        interactionId,
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

    // Delete interaction (handles cache updates)
    const deleted = await deleteInteraction(userId, productId, 'product', type)

    if (!deleted) {
      return NextResponse.json(
        { error: `No ${type} interaction found for this product` },
        { status: 404 }
      )
    }

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
