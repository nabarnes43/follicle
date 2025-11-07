import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { Routine } from '@/types/routine'

/**
 * GET /api/routines/public
 * Fetches ALL public routines (will be cached on frontend)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify auth token
    const userId = await verifyAuthToken(request)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`📖 Fetching all public routines`)

    const snapshot = await adminDb
      .collection('routines')
      .where('is_public', '==', true)
      .where('deleted_at', '==', null)
      .orderBy('created_at', 'desc')
      .get()

    const routines = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Routine[]

    console.log(`✅ Returning ${routines.length} public routines`)

    return Response.json({ routines })
  } catch (error) {
    console.error('Error fetching public routines:', error)
    return Response.json(
      {
        error: 'Failed to fetch public routines',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
