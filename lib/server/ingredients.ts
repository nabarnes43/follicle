import { adminDb } from '@/lib/firebase/admin'
import { Ingredient } from '@/types/ingredient'
import { unstable_cache } from 'next/cache'

/**
 * Get all ingredients (cached with Next.js)
 */
export const getCachedAllIngredients = unstable_cache(
  async (): Promise<Ingredient[]> => {
    const snapshot = await adminDb
      .collection('ingredients')
      .select(
        'inciName',
        'casNo',
        'innName',
        'functionType',
        'product_count',
        'restriction'
      )
      .orderBy('product_count', 'desc')
      .get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      inciName: doc.get('inciName'),
      innName: doc.get('innName'),
      functionType: doc.get('functionType'),
      product_count: doc.get('product_count'),
      restriction: doc.get('restriction'),
      // Other fields not needed for list view
      cosingRefNo: '',
      phEurName: '',
      casNo: '',
      ecNo: '',
      chemIupacDescription: '',
      updateDate: '',
      createdAt: '',
      updatedAt: '',
    })) as Ingredient[]
  },
  ['ingredients-all'],
  {
    revalidate: 3600,
    tags: ['ingredients'],
  }
)

/**
 * Get single ingredient by ID (cached)
 */
export const getCachedIngredientById = unstable_cache(
  async (id: string): Promise<Ingredient | null> => {
    const doc = await adminDb.collection('ingredients').doc(id).get()

    if (!doc.exists) {
      return null
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Ingredient
  },
  ['ingredients-by-id'],
  {
    revalidate: 3600,
    tags: ['ingredients'],
  }
)

/**
 * Get ingredients by IDs (cached)
 */
export const getCachedIngredientsByIds = unstable_cache(
  async (ids: string[]): Promise<Ingredient[]> => {
    if (ids.length === 0) return []

    const ingredients: Ingredient[] = []

    for (const id of ids) {
      const doc = await adminDb.collection('ingredients').doc(id).get()

      if (doc.exists) {
        ingredients.push({
          id: doc.id,
          ...doc.data(),
        } as Ingredient)
      }
    }

    return ingredients
  },
  ['ingredients-by-ids'],
  {
    revalidate: 3600,
    tags: ['ingredients'],
  }
)
