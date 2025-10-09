import { NextRequest } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { Product } from '@/types/product'

/**
 * GET /api/products
 * Returns all products (no scoring, just raw data)
 * Much faster than the recommendations endpoint
 */
export async function GET(request: NextRequest) {
  try {
    console.time('fetch-products')

    // Fetch all products from Firestore
    const productsSnapshot = await getDocs(collection(db, 'products'))
    const products: Product[] = productsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product
    )

    console.timeEnd('fetch-products')
    console.log(`Returned ${products.length} products`)

    return Response.json({
      success: true,
      count: products.length,
      products,
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
