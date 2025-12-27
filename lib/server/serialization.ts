/**
 * Convert Firestore Timestamp to milliseconds (serializable for client components)
 */
export function serializeTimestamp(ts: any): number | null {
  if (!ts) return null
  if (ts._seconds !== undefined) return ts._seconds * 1000 + (ts._nanoseconds || 0) / 1000000
  if (ts.seconds !== undefined) return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000
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
    return doc.map(item => serializeFirestoreDoc(item)) as any
  }

  const serialized: any = {}
  for (const [key, value] of Object.entries(doc)) {
    // Check if it's a Firestore Timestamp
    if (value && typeof value === 'object' && ('_seconds' in value || 'seconds' in value)) {
      serialized[key] = serializeTimestamp(value)
    } else if (value && typeof value === 'object') {
      // Recursively serialize nested objects
      serialized[key] = serializeFirestoreDoc(value)
    } else {
      serialized[key] = value
    }
  }
  return serialized
}