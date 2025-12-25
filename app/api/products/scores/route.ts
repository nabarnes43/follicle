import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'

/**
 * GET /api/products/scores
 * Fetch product score count and completion status (bypasses cache)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuthToken(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's analysis timestamp
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const analysisCompleteAt = userData?.analysisComplete?.toDate()

    // Check first score timestamp
    const firstScoreSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('product_scores')
      .orderBy('scoredAt', 'desc')
      .limit(1)
      .get()

    // No scores yet
    if (firstScoreSnapshot.empty) {
      const totalProductsSnapshot = await adminDb
        .collection('products')
        .count()
        .get()
      return NextResponse.json({
        scores: [],
        count: 0,
        totalProducts: totalProductsSnapshot.data().count,
        isComplete: false,
      })
    }

    // Check if scores are stale
    const firstScore = firstScoreSnapshot.docs[0]
    const scoredAt = firstScore.data().scoredAt?.toDate()

    if (scoredAt && analysisCompleteAt && scoredAt < analysisCompleteAt) {
      console.log(
        `⏳ Scores are stale (scored: ${scoredAt.toISOString()}, analysis: ${analysisCompleteAt.toISOString()})`
      )

      const totalProductsSnapshot = await adminDb
        .collection('products')
        .count()
        .get()
      return NextResponse.json({
        scores: [],
        count: 0,
        totalProducts: totalProductsSnapshot.data().count,
        isComplete: false,
      })
    }

    // Scores are fresh - get count
    const scoresCountSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('product_scores')
      .count()
      .get()

    const scoresCount = scoresCountSnapshot.data().count
    const totalProductsSnapshot = await adminDb
      .collection('products')
      .count()
      .get()
    const totalProducts = totalProductsSnapshot.data().count

    const isComplete = scoresCount >= totalProducts

    console.log(
      `✅ Score count: ${scoresCount}/${totalProducts}${isComplete ? ' - COMPLETE' : ' - IN PROGRESS'}`
    )

    return NextResponse.json({
      scores: [],
      count: scoresCount,
      totalProducts,
      isComplete,
    })
  } catch (error) {
    console.error('Error fetching product scores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    )
  }
}
