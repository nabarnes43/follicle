import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { User } from '@/types/user'
//TODO merge the lib/firebase/auth.ts or really just remove the other and replace cases with this one
/**
 * Get the current user's data from a Server Component
 *
 * How it works:
 * 1. Read the session cookie (set by contexts/auth.tsx on login)
 * 2. Verify the token with Firebase Admin SDK (confirms it's valid and not tampered)
 * 3. Fetch the user's full data from Firestore (includes hairAnalysis)
 *
 * Returns null if:
 * - No session cookie exists (user never logged in on this browser)
 * - Token is invalid or expired (user needs to refresh the page to get new token)
 * - User document doesn't exist in Firestore
 */
export async function getServerUser(): Promise<User | null> {
  try {
    // 1. Get the session cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    console.log('🔐 getServerUser - cookie exists:', !!sessionCookie?.value)

    if (!sessionCookie?.value) {
      console.log('🔐 No session cookie found')
      return null
    }

    console.log('🔐 Verifying token...')
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie.value)
    console.log('🔐 Token verified for user:', decodedToken.uid)
    const userId = decodedToken.uid

    // 3. Fetch user data from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return null
    }

    return userDoc.data() as User
  } catch (error) {
    // Token invalid, expired, or Firestore error
    // This is expected when tokens expire - user just needs to refresh
    console.error('getServerUser error:', error)
    return null
  }
}
