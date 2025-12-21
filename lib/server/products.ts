import { adminDb } from '@/lib/firebase/admin'
import { Product } from '@/types/product'
import { cacheTag } from 'next/cache'

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
function serializeProduct(product: any): Product {
  return {
    ...product,
    created_at: toTimestamp(product.created_at),
    updated_at: toTimestamp(product.updated_at),
  } as Product
}

/**
 * Get all products (cached globally, not user-specific)
 * Ordered alphabetically by name since we don't have interaction_count yet
 */
export async function getCachedAllProducts(): Promise<Product[]> {
  'use cache'
  cacheTag('products')

  const snapshot = await adminDb
    .collection('products')
    .orderBy('name', 'asc') // Alphabetical for now
    .get()

  return snapshot.docs.map((doc) =>
    serializeProduct({
      id: doc.id,
      ...doc.data(),
    })
  )
}

/**
 * Get products by IDs (cached)
 * Used for routine detail pages
 */
export async function getCachedProductsByIds(
  productIds: string[]
): Promise<Product[]> {
  'use cache'
  cacheTag('products')

  if (productIds.length === 0) return []

  const products: Product[] = []

  for (const id of productIds) {
    const doc = await adminDb.collection('products').doc(id).get()

    if (doc.exists) {
      products.push(
        serializeProduct({
          id: doc.id,
          ...doc.data(),
        })
      )
    }
  }

  return products
}

/**
 * Get single product by ID (cached)
 */
export async function getCachedProductById(
  id: string
): Promise<Product | null> {
  'use cache'
  cacheTag('products')

  const doc = await adminDb.collection('products').doc(id).get()

  if (!doc.exists) {
    return null
  }

  return serializeProduct({
    id: doc.id,
    ...doc.data(),
  })
}

/**
 * Get products by category (cached)
 * Ordered alphabetically by name
 */
export async function getCachedProductsByCategory(
  category: string
): Promise<Product[]> {
  'use cache'
  cacheTag('products')

  const snapshot = await adminDb
    .collection('products')
    .where('category', '==', category)
    .orderBy('name', 'asc') // Alphabetical for now
    .get()

  return snapshot.docs.map((doc) =>
    serializeProduct({
      id: doc.id,
      ...doc.data(),
    })
  )
}

/**
 * Get products by ingredient ID (cached)
 * Used for ingredient detail pages
 */
export async function getCachedProductsByIngredient(
  ingredientId: string,
  options?: { limit?: number }
): Promise<Product[]> {
  'use cache'
  cacheTag('products')

  let query = adminDb
    .collection('products')
    .where('ingredient_refs', 'array-contains', ingredientId)
    .orderBy('name', 'asc') // Alphabetical for now

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const snapshot = await query.get()

  return snapshot.docs.map((doc) =>
    serializeProduct({
      id: doc.id,
      ...doc.data(),
    })
  )
}
