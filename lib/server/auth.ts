import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { User } from '@/types/user'
import { serializeFirestoreDoc } from './serialization'

/**
 * Get the current user's data from a Server Component
 * CACHED with in-memory cache
 */
export async function getServerUser(): Promise<User | null> {
  try {
    let cookieStore
    try {
      cookieStore = await cookies()
    } catch (error) {
      console.log('🔐 Prerender detected, returning null user')
      return null
    }

    const sessionCookie = cookieStore.get('session')
    if (!sessionCookie?.value) {
      return null
    }

    const decodedToken = await adminAuth.verifyIdToken(sessionCookie.value)
    const userId = decodedToken.uid

    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return null
    }
    return serializeFirestoreDoc<User>({
      userId,
      ...userDoc.data(),
    })
  } catch (error) {
    console.error('getServerUser error:', error)
    return null
  }
}
