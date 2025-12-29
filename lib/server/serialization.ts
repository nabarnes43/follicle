/**
 * Convert Firestore Timestamp to Date (serializable)
 */
export function toDate(ts: any): Date | null {
  if (!ts) return null
  if (ts._seconds !== undefined) return new Date(ts._seconds * 1000)
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000)
  if (ts instanceof Date) return ts
  return null
}

/**
 * Convert Firestore Timestamp to milliseconds (serializable)
 */
export function toTimestamp(ts: any): number | null {
  if (!ts) return null
  if (ts._seconds) return ts._seconds * 1000
  if (ts.seconds) return ts.seconds * 1000
  if (ts instanceof Date) return ts.getTime()
  if (typeof ts === 'number') return ts
  return null
}

/**
 * Recursively serialize all Firestore Timestamps in an object
 */
export function serializeFirestoreDoc<T>(doc: any): T {
  if (!doc || typeof doc !== 'object') return doc

  if (Array.isArray(doc)) {
    return doc.map((item) => serializeFirestoreDoc(item)) as any
  }

  const serialized: any = {}
  for (const [key, value] of Object.entries(doc)) {
    // Check if it's a Firestore Timestamp
    if (
      value &&
      typeof value === 'object' &&
      ('_seconds' in value || 'seconds' in value)
    ) {
      serialized[key] = toTimestamp(value)
    } else if (value && typeof value === 'object') {
      // Recursively serialize nested objects
      serialized[key] = serializeFirestoreDoc(value)
    } else {
      serialized[key] = value
    }
  }
  return serialized
}
