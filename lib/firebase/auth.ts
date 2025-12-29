import { adminAuth } from '@/lib/firebase/admin'
import { NextRequest } from 'next/server'

/**
 * Verifies Firebase Auth token from request headers (for API routes)
 * Note: Server Components should use getServerUser() from lib/server/auth.ts instead
 */
export async function verifyAuthToken(
  request: NextRequest
): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)

    return decodedToken.uid
  } catch (error) {
    console.error('❌ Token verification failed:', error)
    return null
  }
}
