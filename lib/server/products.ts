import { adminDb } from '@/lib/firebase/admin'
import { Product } from '@/types/product'
import { ProductMatchScore } from '@/types/productMatching'
import { HairAnalysis } from '@/types/user'
import { matchProductsForUser } from '@/lib/matching/products/productMatcher'
import { generateFollicleId } from '@/lib/analysis/follicleId'

/**
 * Filter types that determine which Firestore query to run
 * Each filter reduces the dataset BEFORE scoring (performance optimization)
 */
export interface ProductFilters {
  category?: string // e.g., "Shampoos" - filters by product.category
  ingredientId?: string // e.g., "niacinamide" - filters by ingredient_refs array
  brand?: string // e.g., "Olaplex" - filters by product.brand (future use)
}

/**
 * Fetch products from Firestore with optional filters
 *
 * Why filter at the database level?
 * - Fetching all 8,000 products is slow
 * - Filtering first means we only fetch what we need (e.g., 500 shampoos)
 * - Scoring 500 products is much faster than scoring 8,000
 */
async function fetchFilteredProducts(
  filters: ProductFilters
): Promise<Product[]> {
  let query: FirebaseFirestore.Query = adminDb.collection('products')

  if (filters.category) {
    query = query.where('category', '==', filters.category)
  }

  if (filters.ingredientId) {
    query = query.where(
      'ingredient_refs',
      'array-contains',
      filters.ingredientId
    )
  }

  if (filters.brand) {
    query = query.where('brand', '==', filters.brand)
  }

  const snapshot = await query.get()

  // Map and serialize to plain objects
  return snapshot.docs.map((doc) =>
    serializeProduct({
      id: doc.id,
      ...doc.data(),
    } as Product)
  )
}

/**
 * Convert Firestore data to plain objects for Client Components
 * Timestamps become ISO strings, class instances become plain objects
 */
function serializeProduct(product: Product): Product {
  return JSON.parse(JSON.stringify(product))
}

/**
 * Main entry point for Server Components
 *
 * Fetches filtered products, scores them for the user, returns sorted results
 *
 * @param filters - Which products to fetch (category, ingredient, brand)
 * @param hairAnalysis - User's hair profile (used for scoring)
 * @param follicleId - User's follicle ID (used for engagement scoring)
 * @param limit - Max products to return (default 100)
 */
export async function getFilteredProducts(
  filters: ProductFilters,
  hairAnalysis: HairAnalysis,
  follicleId: string
): Promise<ProductMatchScore[]> {
  // 1. Fetch only the products that match our filters
  const products = await fetchFilteredProducts(filters)

  console.log(`📦 Fetched ${products.length} products with filters:`, filters)

  // 2. If no products match filters, return empty array
  if (products.length === 0) {
    return []
  }

  // 3. Score and sort them for this user
  const scored = await matchProductsForUser(
    { hairAnalysis },
    products,
    follicleId
  )

  return scored
}
