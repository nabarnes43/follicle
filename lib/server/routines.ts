import { adminDb } from '@/lib/firebase/admin'
import { Routine } from '@/types/routine'
import { cacheTag } from 'next/cache'

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
 * Serialize routine for client component (converts Timestamps)
 */
function serializeRoutine(routine: any): Routine {
  return {
    ...routine,
    created_at: toDate(routine.created_at),
    updated_at: toDate(routine.updated_at),
    deleted_at: toDate(routine.deleted_at),
  } as Routine
}

/**
 * Get all public routines (cached globally, not user-specific)
 * Ordered alphabetically by name since we don't have interaction_count yet
 */
export async function getCachedPublicRoutines(): Promise<Routine[]> {
  'use cache'
  cacheTag('routines')

  const snapshot = await adminDb
    .collection('routines')
    .where('is_public', '==', true)
    .orderBy('name', 'asc') // Alphabetical for now
    .get()

  return snapshot.docs.map(doc => serializeRoutine({
    id: doc.id,
    ...doc.data()
  }))
}

/**
 * Get single routine by ID (cached)
 * No privacy check - caller must verify is_public or ownership
 */
export async function getCachedRoutineById(
  id: string
): Promise<Routine | null> {
  'use cache'
  cacheTag('routines')

  const doc = await adminDb.collection('routines').doc(id).get()

  if (!doc.exists) {
    return null
  }

  return serializeRoutine({
    id: doc.id,
    ...doc.data()
  })
}