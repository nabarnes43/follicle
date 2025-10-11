import { NextRequest } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { Product } from '@/types/product'

// Server-side in-memory cache
let cachedProducts: Product[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 1000 * 60 * 120 // 2 hour (adjust as needed)

/**
 * GET /api/products
 * Returns all products (no scoring, just raw data)
 * Much faster than the recommendations endpoint
 *
 * Server-side caching: First request fetches from Firestore (20s),
 * subsequent requests return from memory (instant)
 */
export async function GET(request: NextRequest) {
  try {
    const now = Date.now()

    // Return cached products if still valid
    if (cachedProducts && now - cacheTimestamp < CACHE_DURATION) {
      console.log(
        `✅ Returning ${cachedProducts.length} cached products from server memory`
      )
      return Response.json({
        success: true,
        count: cachedProducts.length,
        products: cachedProducts,
        cached: true,
        cacheAge: Math.round((now - cacheTimestamp) / 1000), // seconds
      })
    }

    // Cache expired or doesn't exist - fetch from Firestore
    console.time('fetch-products-from-firestore')
    console.log(
      '🚀 Fetching products from Firestore (cache miss or expired)...'
    )

    // Fetch all products from Firestore
    const productsSnapshot = await getDocs(collection(db, 'products'))
    const products: Product[] = productsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product
    )

    // Update cache
    cachedProducts = products
    cacheTimestamp = now

    console.timeEnd('fetch-products-from-firestore')
    console.log(`✅ Cached ${products.length} products in server memory`)

    return Response.json({
      success: true,
      count: products.length,
      products,
      cached: false,
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return Response.json(
      {
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
