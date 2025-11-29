import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { IngredientInteractionType } from '@/types/ingredientInteraction'

const VALID_TYPES: IngredientInteractionType[] = [
  'like',
  'dislike',
  'avoid',
  'allergic',
  'view',
]

// Map interaction types to user cache field names
const CACHE_FIELD_MAP: Record<string, string> = {
  like: 'likedIngredients',
  dislike: 'dislikedIngredients',
  avoid: 'avoidIngredients',
  allergic: 'allergicIngredients',
}

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

    // Views allow multiple, others don't
    if (type !== 'view') {
      const existingInteraction = await adminDb
        .collection('ingredient_interactions')
        .where('userId', '==', userId)
        .where('ingredientId', '==', ingredientId)
        .where('type', '==', type)
        .limit(1)
        .get()

      if (!existingInteraction.empty) {
        return NextResponse.json(
          { error: `You already ${type}d this ingredient` },
          { status: 409 }
        )
      }
    }

    // Check for mutual exclusivity (like vs dislike)
    let oppositeType: IngredientInteractionType | null = null
    if (type === 'like') oppositeType = 'dislike'
    if (type === 'dislike') oppositeType = 'like'

    let oppositeInteractionDoc = null

    if (oppositeType) {
      const oppositeQuery = await adminDb
        .collection('ingredient_interactions')
        .where('userId', '==', userId)
        .where('ingredientId', '==', ingredientId)
        .where('type', '==', oppositeType)
        .limit(1)
        .get()

      if (!oppositeQuery.empty) {
        oppositeInteractionDoc = oppositeQuery.docs[0]
      }
    }

    // Use batch write
    const batch = adminDb.batch()
    const userRef = adminDb.collection('users').doc(userId)

    // Delete opposite interaction if exists
    if (oppositeInteractionDoc && oppositeType) {
      batch.delete(oppositeInteractionDoc.ref)

      // Remove from user cache
      const oppositeField = CACHE_FIELD_MAP[oppositeType]
      if (oppositeField) {
        batch.update(userRef, {
          [oppositeField]: FieldValue.arrayRemove(ingredientId),
        })
      }
    }

    // Create new interaction
    const newInteractionRef = adminDb
      .collection('ingredient_interactions')
      .doc()
    batch.set(newInteractionRef, {
      userId,
      ingredientId,
      follicleId,
      type,
      timestamp: FieldValue.serverTimestamp(),
    })

    // Update user cache (not for views)
    const cacheField = CACHE_FIELD_MAP[type]
    if (cacheField) {
      batch.update(userRef, {
        [cacheField]: FieldValue.arrayUnion(ingredientId),
      })
    }

    await batch.commit()

    return NextResponse.json(
      {
        success: true,
        message: `Ingredient ${type}d successfully`,
        interactionId: newInteractionRef.id,
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

    // Find the interaction
    const interactionQuery = await adminDb
      .collection('ingredient_interactions')
      .where('userId', '==', userId)
      .where('ingredientId', '==', ingredientId)
      .where('type', '==', type)
      .limit(1)
      .get()

    if (interactionQuery.empty) {
      return NextResponse.json(
        { error: `No ${type} interaction found for this ingredient` },
        { status: 404 }
      )
    }

    const interactionDoc = interactionQuery.docs[0]

    // Use batch write
    const batch = adminDb.batch()

    // Delete interaction
    batch.delete(interactionDoc.ref)

    // Update user cache (not for views)
    const cacheField = CACHE_FIELD_MAP[type]
    if (cacheField) {
      const userRef = adminDb.collection('users').doc(userId)
      batch.update(userRef, {
        [cacheField]: FieldValue.arrayRemove(ingredientId),
      })
    }

    await batch.commit()

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
