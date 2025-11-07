import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'

/**
 * GET /api/routines
 * Gets all routines for authenticated user (desc order)
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ Get userId from auth token (not search params)
    const userId = await verifyAuthToken(request)

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const snapshot = await adminDb
      .collection('routines')
      .where('user_id', '==', userId)
      .where('deleted_at', '==', null)
      .orderBy('updated_at', 'desc')
      .get()

    const routines = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return Response.json({ routines })
  } catch (error) {
    console.error('Error fetching routines:', error)
    return Response.json({ error: 'Failed to fetch routines' }, { status: 500 })
  }
}
