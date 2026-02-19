import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'

/**
 * GET /api/products/[productId]/score
 * Fetch fresh product score for current user (bypasses cache)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request)
    const { productId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch score directly from Firestore (no cache)
    const scoreDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('product_scores')
      .doc(productId)
      .get()

    if (!scoreDoc.exists) {
      return NextResponse.json({ score: null }, { status: 200 })
    }

    const data = scoreDoc.data()!

    const score = {
      product: {
        id: productId,
        name: data.productName,
        brand: data.productBrand,
        image_url: data.productImageUrl,
        price: data.productPrice,
        category: data.category,
      },
      totalScore: data.score,
      breakdown: data.breakdown,
      matchReasons: data.matchReasons || [],
    }

    console.log(
      `Fetched fresh score for product ${productId}: ${data.score.toFixed(4)}`
    )

    return NextResponse.json({ score }, { status: 200 })
  } catch (error) {
    console.error('Error fetching product score:', error)
    return NextResponse.json(
      { error: 'Failed to fetch score' },
      { status: 500 }
    )
  }
}
