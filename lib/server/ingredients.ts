import { adminDb } from '@/lib/firebase/admin'
import { Ingredient } from '@/types/ingredient'
import { cacheTag } from 'next/cache'

/**
 * Get all ingredients (cached globally, not user-specific)
 */
export async function getCachedAllIngredients(): Promise<Ingredient[]> {
  'use cache'
  cacheTag('ingredients')

  const snapshot = await adminDb
    .collection('ingredients')
    .orderBy('product_count', 'desc') // Most common ingredients first
    .get()

  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Ingredient
  )
}

/**
 * Get single ingredient by ID (cached)
 */
export async function getCachedIngredientById(
  id: string
): Promise<Ingredient | null> {
  'use cache'
  cacheTag('ingredients')

  const doc = await adminDb.collection('ingredients').doc(id).get()

  if (!doc.exists) {
    return null
  }

  return {
    id: doc.id,
    ...doc.data(),
  } as Ingredient
}

/**
 * Get ingredients by IDs (cached)
 * Used for saved/liked/disliked/avoid/allergic pages
 */
export async function getCachedIngredientsByIds(
  ids: string[]
): Promise<Ingredient[]> {
  'use cache'
  cacheTag('ingredients')

  if (ids.length === 0) return []

  const ingredients: Ingredient[] = []

  for (const id of ids) {
    const doc = await adminDb.collection('ingredients').doc(id).get()

    if (doc.exists) {
      ingredients.push({
        id: doc.id,
        ...doc.data()
      } as Ingredient)
    }
  }

  // Sort by product count (descending) - most common first
  return ingredients.sort(
    (a, b) => (b.product_count ?? 0) - (a.product_count ?? 0)
  )
}
/**
 * Serialize ingredient for client component (converts Timestamps if needed)
 */
export function serializeIngredient(ingredient: Ingredient): Ingredient {
  return {
    ...ingredient,
    // Add timestamp conversions if Ingredient type has Date fields
    // For now, returning as-is since Ingredient has string dates
  }
}
