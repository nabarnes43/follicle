import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { userId, productId, type } = await request.json()

    if (!userId || !productId || !type) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const validTypes = ['like', 'dislike', 'save', 'view']
    if (!validTypes.includes(type)) {
      return Response.json(
        { success: false, error: 'Invalid type' },
        { status: 400 }
      )
    }

    // Use Admin SDK (not client SDK)
    const userDoc = await adminDb.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const follicleId = userData?.follicleId
    const hairType = userData?.hairAnalysis?.hairType || 'unknown'

    // Create interaction
    const interactionId = `${userId}_${productId}_${type}`
    await adminDb.collection('interactions').doc(interactionId).set({
      userId,
      follicleId,
      productId,
      type,
      hairType,
      timestamp: Date.now(),
    })

    // Update user cache
    const cacheField =
      type === 'like'
        ? 'likedProducts'
        : type === 'dislike'
          ? 'dislikedProducts'
          : type === 'save'
            ? 'savedProducts'
            : null

    if (cacheField) {
      await adminDb
        .collection('users')
        .doc(userId)
        .update({
          [cacheField]: FieldValue.arrayUnion(productId),
        })
    }

    return Response.json({
      success: true,
      message: `Product ${type}d successfully`,
    })
  } catch (error) {
    console.error('Interaction API error:', error)
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
