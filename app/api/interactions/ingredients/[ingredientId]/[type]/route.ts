import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { IngredientInteractionType } from '@/types/ingredientInteraction'
import {
  createInteraction,
  deleteInteraction,
  interactionExists,
} from '@/lib/server/interactions'

const VALID_TYPES: IngredientInteractionType[] = [
  'like',
  'dislike',
  'avoid',
  'allergic',
  'view',
]

/**
 * POST /api/interactions/ingredients/[ingredientId]/[type]
 * Create an ingredient interaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ingredientId: string; type: string }> }
) {
  try {
    const userId = await verifyAuthToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ingredientId, type } = await params

    // Validation
    if (!ingredientId || !type) {
      return NextResponse.json(
        { error: 'Missing required params: ingredientId, type' },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type as IngredientInteractionType)) {
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

    const exists = await interactionExists(
      userId,
      ingredientId,
      'ingredient',
      type
    )

    if (exists) {
      console.log(
        `Interaction already exists: ${type} on ingredient ${ingredientId}`
      )
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
      ingredientId,
      'ingredient',
      type,
      follicleId
    )

    return NextResponse.json(
      {
        success: true,
        message: `Ingredient ${type}d successfully`,
        interactionId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating ingredient interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create interaction. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/interactions/ingredients/[ingredientId]/[type]
 * Remove an ingredient interaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ ingredientId: string; type: string }> }
) {
  try {
    const userId = await verifyAuthToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ingredientId, type } = await params

    // Validation
    if (!ingredientId || !type) {
      return NextResponse.json(
        { error: 'Missing required params: ingredientId, type' },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type as IngredientInteractionType)) {
      return NextResponse.json(
        {
          error: `Invalid interaction type. Must be: ${VALID_TYPES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Delete interaction (handles cache updates)
    const deleted = await deleteInteraction(
      userId,
      ingredientId,
      'ingredient',
      type
    )

    if (!deleted) {
      return NextResponse.json(
        { error: `No ${type} interaction found for this ingredient` },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: `Ingredient un-${type}d successfully`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting ingredient interaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete interaction. Please try again.' },
      { status: 500 }
    )
  }
}
