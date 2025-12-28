import { adminDb } from '@/lib/firebase/admin'
import { PreComputedProductMatchScore } from '@/types/productMatching'
import { cacheTag } from 'next/cache'

/**
 * Transform Firestore doc to PreComputedProductMatchScore
 */
function docToScore(
  doc: FirebaseFirestore.QueryDocumentSnapshot
): PreComputedProductMatchScore {
  const data = doc.data()
  return {
    product: {
      id: doc.id,
      name: data.productName,
      brand: data.productBrand,
      image_url: data.productImageUrl,
      price: data.productPrice,
      category: data.category,
    },
    totalScore: data.score,
    breakdown: data.breakdown,
    matchReasons: data.matchReasons || [],
  }
}

/**
 * Get all product scores for a user (cached)
 */
export async function getCachedAllScores(userId: string) {
  'use cache'
  cacheTag(`user-scores-${userId}`)

  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('product_scores')
    .orderBy('score', 'desc') // CHANGED: from orderBy('rank')
    .get()

  return snapshot.docs.map(docToScore)
}

/**
 * Get product scores filtered by ingredient (cached)
 */
export async function getCachedScoresByIngredient(
  userId: string,
  ingredientId: string,
  options?: { limit?: number }
) {
  'use cache'
  cacheTag(`user-scores-${userId}`)

  let query = adminDb
    .collection('users')
    .doc(userId)
    .collection('product_scores')
    .where('ingredientRefs', 'array-contains', ingredientId)
    .orderBy('score', 'desc') // CHANGED: from orderBy('rank')

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(docToScore)
}

/**
 * Get product scores for specific product IDs (cached)
 */
export async function getCachedScoresByIds(
  userId: string,
  productIds: string[]
) {
  'use cache'
  cacheTag(`user-scores-${userId}`)

  if (productIds.length === 0) return []

  const scores: PreComputedProductMatchScore[] = []

  for (const productId of productIds) {
    const doc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('product_scores')
      .doc(productId)
      .get()

    if (doc.exists) {
      const data = doc.data()!
      scores.push({
        product: {
          id: doc.id,
          name: data.productName,
          brand: data.productBrand,
          image_url: data.productImageUrl,
          price: data.productPrice,
          category: data.category,
        },
        totalScore: data.score,
        breakdown: data.breakdown,
        matchReasons: data.matchReasons || [],
      })
    }
  }

  return scores.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
}

/**
 * Convert Firestore Timestamp to milliseconds (serializable)
 */
function toTimestamp(ts: any): number | null {
  if (!ts) return null
  if (ts._seconds) return ts._seconds * 1000
  if (ts.seconds) return ts.seconds * 1000
  if (ts instanceof Date) return ts.getTime()
  return null
}

/**
 * Serialize product for client component (converts Timestamps)
 */
export function serializeProduct(product: any): any {
  return {
    ...product,
    created_at: toTimestamp(product.created_at),
    updated_at: toTimestamp(product.updated_at),
  }
}
