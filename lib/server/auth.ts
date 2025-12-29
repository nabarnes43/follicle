import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { User } from '@/types/user'
import { cache } from 'react'

/**
 * Convert Firestore Timestamp to Date (serializable)
 */
function toDate(ts: any): Date | null {
  if (!ts) return null
  if (ts._seconds !== undefined) return new Date(ts._seconds * 1000)
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000)
  if (ts instanceof Date) return ts
  return null
}

/**
 * Serialize user for client component (converts ALL Timestamps)
 */
function serializeUser(user: any): User {
  const serialized = { ...user }

  if (serialized.createdAt) {
    serialized.createdAt = toDate(serialized.createdAt)
  }
  if (serialized.lastLoginAt) {
    serialized.lastLoginAt = toDate(serialized.lastLoginAt)
  }
  if (serialized.analysisComplete) {
    serialized.analysisComplete = toDate(serialized.analysisComplete)
  }
  if (serialized.quizComplete) {
    serialized.quizComplete = toDate(serialized.quizComplete)
  }

  return serialized as User
}

/**
 * Get the current user's data from a Server Component
 * Returns serialized user data (safe to pass to client components)
 */
/**
 * Get the current user's data from a Server Component
 * CACHED - will only run once per request even if called multiple times
 */
export const getServerUser = cache(async (): Promise<User | null> => {
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

    return serializeUser(userDoc.data())
  } catch (error) {
    console.error('getServerUser error:', error)
    return null
  }
})
