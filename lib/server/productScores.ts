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
    .orderBy('rank')
    .get()

  return snapshot.docs.map(docToScore)
}

/**
 * Get product scores filtered by category (cached)
 */
export async function getCachedScoresByCategory(
  userId: string,
  category: string
) {
  'use cache'
  cacheTag(`user-scores-${userId}`)

  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('product_scores')
    .where('category', '==', category)
    .orderBy('rank')
    .get()

  return snapshot.docs.map(docToScore)
}

/**
 * Get product scores filtered by ingredient (cached)
 */
export async function getCachedScoresByIngredient(
  userId: string,
  ingredientId: string
) {
  'use cache'
  cacheTag(`user-scores-${userId}`)

  const snapshot = await adminDb
    .collection('users')
    .doc(userId)
    .collection('product_scores')
    .where('ingredientRefs', 'array-contains', ingredientId)
    .orderBy('rank')
    .get()

  return snapshot.docs.map(docToScore)
}

/**
 * Get product scores for specific product IDs (cached)
 */
export async function getCachedScoresByIds(userId: string, productIds: string[]) {
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

  return scores.sort((a, b) => b.totalScore - a.totalScore)
}