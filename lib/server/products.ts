import { adminDb } from '@/lib/firebase/admin'
import { Product } from '@/types/product'
import { serializeFirestoreDoc } from './serialization'
import { unstable_cache } from 'next/cache'

/**
 * Get all products (cached with Next.js)
 */
export const getCachedAllProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const snapshot = await adminDb
      .collection('products')
      .where('status', '==', 'approved')
      .select('brand', 'name', 'category', 'price', 'image_url')
      .orderBy('name', 'asc')
      .get()

    return snapshot.docs.map((doc) =>
      serializeFirestoreDoc<Product>({
        id: doc.id,
        brand: doc.get('brand'),
        name: doc.get('name'),
        category: doc.get('category'),
        price: doc.get('price'),
        image_url: doc.get('image_url'),
        created_at: null,
        updated_at: null,
      } as any)
    )
  },
  ['products-all'],
  {
    revalidate: 3600, // 1 hour
    tags: ['products'],
  }
)

/**
 * Get products by IDs (cached)
 */
export const getCachedProductsByIds = unstable_cache(
  async (productIds: string[]): Promise<Product[]> => {
    if (productIds.length === 0) return []

    const products: Product[] = []

    for (const id of productIds) {
      const doc = await adminDb.collection('products').doc(id).get()
      if (doc.exists && doc.data()?.status === 'approved') {
        products.push(
          serializeFirestoreDoc<Product>({
            id: doc.id,
            ...doc.data(),
          })
        )
      }
    }

    return products
  },
  ['products-by-ids'],
  {
    revalidate: 3600,
    tags: ['products'],
  }
)

/**
 * Get single product by ID (cached)
 */
export const getCachedProductById = unstable_cache(
  async (id: string, userId?: string): Promise<Product | null> => {
    const doc = await adminDb.collection('products').doc(id).get()

    if (!doc.exists) return null

    const data = doc.data()!
    // Allow if approved or if the requesting user submitted it
    if (data.status !== 'approved' && data.addedByUserId !== userId) return null

    return serializeFirestoreDoc<Product>({
      id: doc.id,
      ...doc.data(),
    })
  },
  ['products-by-id'],
  {
    revalidate: 3600,
    tags: ['products'],
  }
)

/**
 * Get products by ingredient ID (cached)
 */
export const getCachedProductsByIngredient = unstable_cache(
  async (
    ingredientId: string,
    options?: { limit?: number }
  ): Promise<Product[]> => {
    let query = adminDb
      .collection('products')
      .where('ingredient_refs', 'array-contains', ingredientId)
      .where('status', '==', 'approved')
      .select('brand', 'name', 'category', 'price', 'image_url')
      .orderBy('name', 'asc')

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const snapshot = await query.get()

    return snapshot.docs.map((doc) =>
      serializeFirestoreDoc<Product>({
        id: doc.id,
        brand: doc.get('brand'),
        name: doc.get('name'),
        category: doc.get('category'),
        price: doc.get('price'),
        image_url: doc.get('image_url'),
        created_at: null,
        updated_at: null,
      } as any)
    )
  },
  ['products-by-ingredient'],
  {
    revalidate: 3600,
    tags: ['products'],
  }
)
