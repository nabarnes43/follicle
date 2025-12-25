import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'

/**
 * GET /api/routines/scores
 * Fetch routine score count and completion status (bypasses cache)
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
      .collection('routine_scores')
      .orderBy('scoredAt', 'desc')
      .limit(1)
      .get()

    // No scores yet
    if (firstScoreSnapshot.empty) {
      const allPublicRoutinesSnapshot = await adminDb
        .collection('routines')
        .where('is_public', '==', true)
        .get()

      const totalRoutines = allPublicRoutinesSnapshot.docs.filter(
        (doc) => !doc.data().deleted_at
      ).length

      return NextResponse.json({
        routines: [],
        count: 0,
        totalRoutines,
        isComplete: false,
      })
    }

    // Check if scores are stale
    const firstScore = firstScoreSnapshot.docs[0]
    const scoredAt = firstScore.data().scoredAt?.toDate()

    if (scoredAt && analysisCompleteAt && scoredAt < analysisCompleteAt) {
      console.log(
        `⏳ Routine scores are stale (scored: ${scoredAt.toISOString()}, analysis: ${analysisCompleteAt.toISOString()})`
      )

      const allPublicRoutinesSnapshot = await adminDb
        .collection('routines')
        .where('is_public', '==', true)
        .get()

      const totalRoutines = allPublicRoutinesSnapshot.docs.filter(
        (doc) => !doc.data().deleted_at
      ).length

      return NextResponse.json({
        routines: [],
        count: 0,
        totalRoutines,
        isComplete: false,
      })
    }

    // ✅ Scores are fresh - get count
    const scoresCountSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('routine_scores')
      .count()
      .get()

    const scoresCount = scoresCountSnapshot.data().count

    const allPublicRoutinesSnapshot = await adminDb
      .collection('routines')
      .where('is_public', '==', true)
      .get()

    const totalRoutines = allPublicRoutinesSnapshot.docs.filter(
      (doc) => !doc.data().deleted_at
    ).length

    const isComplete = scoresCount >= totalRoutines

    console.log(
      `✅ Routine score count: ${scoresCount}/${totalRoutines}${isComplete ? ' - COMPLETE' : ' - IN PROGRESS'}`
    )

    return NextResponse.json({
      routines: [],
      count: scoresCount,
      totalRoutines,
      isComplete,
    })
  } catch (error) {
    console.error('Error fetching routine scores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch routine scores' },
      { status: 500 }
    )
  }
}
