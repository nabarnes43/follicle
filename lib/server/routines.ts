import { adminDb } from '@/lib/firebase/admin'
import { Routine } from '@/types/routine'
import { serializeFirestoreDoc } from './serialization'
import { unstable_cache } from 'next/cache'

/**
 * Get all public routines (cached with Next.js)
 */
export const getCachedPublicRoutines = unstable_cache(
  async (): Promise<Routine[]> => {
    const snapshot = await adminDb
      .collection('routines')
      .where('is_public', '==', true)
      .orderBy('name', 'asc')
      .get()

    return snapshot.docs.map((doc) =>
      serializeFirestoreDoc<Routine>({
        id: doc.id,
        ...doc.data(),
      })
    )
  },
  ['routines-public-all'],
  {
    revalidate: 300, // 5 minutes (routines change more often)
    tags: ['routines-public'],
  }
)

/**
 * Get single routine by ID (NOT cached - changes frequently via edits)
 * No privacy check - caller must verify is_public or ownership
 */
export async function getCachedRoutineById(
  id: string
): Promise<Routine | null> {
  const doc = await adminDb.collection('routines').doc(id).get()

  if (!doc.exists) {
    return null
  }

  return serializeFirestoreDoc<Routine>({
    id: doc.id,
    ...doc.data(),
  })
}
