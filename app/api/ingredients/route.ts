import { adminDb } from '@/lib/firebase/admin'
import { Ingredient } from '@/types/ingredient'

// Server-side in-memory cache
let cachedIngredients: Ingredient[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 1000 * 60 * 120 // 2 hours

/**
 * GET /api/ingredients
 * Returns all ingredients
 */
export async function GET() {
  try {
    const now = Date.now()

    // Return cached ingredients if still valid
    if (cachedIngredients && now - cacheTimestamp < CACHE_DURATION) {
      console.log(`✅ Returning ${cachedIngredients.length} cached ingredients`)
      return Response.json({
        success: true,
        count: cachedIngredients.length,
        ingredients: cachedIngredients,
        cached: true,
      })
    }

    // Fetch from Firestore
    console.log('🚀 Fetching ingredients from Firestore...')
    console.time('fetch-ingredients')

    const snapshot = await adminDb.collection('ingredients').get()
    cachedIngredients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ingredient[]

    cacheTimestamp = now

    console.timeEnd('fetch-ingredients')
    console.log(`✅ Cached ${cachedIngredients.length} ingredients`)

    return Response.json({
      success: true,
      count: cachedIngredients.length,
      ingredients: cachedIngredients,
      cached: false,
    })
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    return Response.json(
      {
        error: 'Failed to fetch ingredients',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
