import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'

/**
 * GET /api/routines/[routineId]/score
 * Fetch fresh routine score directly from Firestore (bypasses cache)
 * Called by client after interactions to show updated score immediately
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const userId = await verifyAuthToken(request)
    const { routineId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch score directly from Firestore (no cache)
    const scoreDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('routine_scores')
      .doc(routineId)
      .get()

    if (!scoreDoc.exists) {
      return NextResponse.json({ score: null }, { status: 200 })
    }

    const data = scoreDoc.data()!

    const score = {
      routine: {
        id: routineId,
        name: data.routineName,
        stepCount: data.routineStepCount,
        frequency: data.routineFrequency,
        userId: data.routineUserId,
        isPublic: data.routineIsPublic,
        steps: data.routineSteps || [],
      },
      totalScore: data.score,
      breakdown: data.breakdown,
      matchReasons: data.matchReasons || [],
    }

    console.log(
      `✅ Fetched fresh score for routine ${routineId}: ${data.score.toFixed(4)}`
    )

    return NextResponse.json({ score }, { status: 200 })
  } catch (error) {
    console.error('Error fetching routine score:', error)
    return NextResponse.json(
      { error: 'Failed to fetch routine score' },
      { status: 500 }
    )
  }
}
