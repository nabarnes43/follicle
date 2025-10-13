import { Product } from '@/types/product'
import { MatchScore } from '@/types/matching'

/**
 * ProductsCache - In-memory caching for products and match scores
 *
 * Products Cache:
 * - Prevents redundant API calls during same page session
 * - Cleared on page refresh (ensures fresh data)
 * - Sever side caching to prevent repeat calls on refresh
 *
 * Match Scores Cache:
 * - Prevents expensive recalculation on tab switches
 * - Keyed by userId (scores use user's full profile + engagement data)
 * - Cleared when user updates profile or on page refresh
 *
 * Usage:
 * ```typescript
 * // Try to get cached scores
 * let scored = productsCache.getScoredProducts(userId, productIds)
 *
 * if (!scored) {
 *   // Calculate scores
 *   scored = await matchProductsForUser(...)
 *   // Cache them
 *   productsCache.setScoredProducts(userId, scored)
 * }
 * ```
 */

class ProductsCache {
  private static instance: ProductsCache

  // Products cache
  private products: Product[] | null = null
  private fetchPromise: Promise<Product[]> | null = null

  // Match scores cache - keyed by userId
  // Stores ALL scored products for a user
  private scoredProducts: Map<string, MatchScore[]> = new Map()

  private constructor() {}

  static getInstance(): ProductsCache {
    if (!ProductsCache.instance) {
      ProductsCache.instance = new ProductsCache()
    }
    return ProductsCache.instance
  }

  /**
   * Get all products
   * - First call: fetches from API
   * - Subsequent calls: returns cached copy
   * - Cache persists only during current page session
   */
  async getProducts(): Promise<Product[]> {
    if (this.products) {
      console.log('✅ Using cached products from memory')
      return this.products
    }

    if (this.fetchPromise) {
      console.log('⏳ Waiting for in-progress fetch...')
      return this.fetchPromise
    }

    console.log('🚀 Fetching products from API...')
    this.fetchPromise = this.fetchFromAPI()

    return this.fetchPromise
  }

  /**
   * Fetch products from API
   */
  private async fetchFromAPI(): Promise<Product[]> {
    try {
      const response = await fetch('/api/products')

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      const products: Product[] = data.products

      this.products = products

      const cacheStatus = data.cached
        ? '(from server cache)'
        : '(fresh from Firestore)'
      console.log(`✅ Loaded ${products.length} products ${cacheStatus}`)

      return products
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    } finally {
      this.fetchPromise = null
    }
  }

  /**
   * Get ALL scored products for a user
   * Returns null if not cached
   */
  getAllScoredProducts(userId: string): MatchScore[] | null {
    const cached = this.scoredProducts.get(userId)
    if (cached) {
      console.log(
        `✅ Using cached scores for userId: ${userId} (${cached.length} products)`
      )
    }
    return cached || null
  }

  /**
   * Get scored products filtered by product IDs
   * Useful for saved/liked/disliked tabs where you only need specific products
   * Returns null if full cache doesn't exist
   */
  getScoredProducts(
    userId: string,
    productIds?: string[]
  ): MatchScore[] | null {
    const allScored = this.getAllScoredProducts(userId)
    if (!allScored) return null

    // If no filter, return all
    if (!productIds || productIds.length === 0) return allScored

    // Filter by product IDs
    const idSet = new Set(productIds)
    const filtered = allScored.filter((m) => idSet.has(m.product.id))

    console.log(
      `✅ Filtered ${filtered.length}/${allScored.length} cached scores for userId: ${userId}`
    )
    return filtered
  }

  /**
   * Cache ALL scored products for a user
   * This should be the full scored product list (usually from recommendations page)
   */
  setAllScoredProducts(userId: string, scored: MatchScore[]): void {
    this.scoredProducts.set(userId, scored)
    console.log(
      `💾 Cached ${scored.length} scored products for userId: ${userId}`
    )
  }

  /**
   * Clear scored products cache for a specific user
   * Call this when user updates their hair profile
   */
  clearScoredProducts(userId: string): void {
    this.scoredProducts.delete(userId)
    console.log(`🗑️ Cleared scored products cache for userId: ${userId}`)
  }

  /**
   * Clear all scored products (all users)
   */
  clearAllScoredProducts(): void {
    this.scoredProducts.clear()
    console.log('🗑️ Cleared all scored products cache')
  }

  /**
   * Prefetch products in background
   */
  prefetch(): void {
    this.getProducts().catch((err) => {
      console.error('Prefetch failed:', err)
    })
  }

  /**
   * Clear products cache
   */
  clearProducts(): void {
    this.products = null
    console.log('🗑️ Cleared products cache')
  }

  /**
   * Check if products are currently cached
   */
  hasCachedProducts(): boolean {
    return this.products !== null
  }

  /**
   * Check if scores are cached for a user
   */
  hasCachedScores(userId: string): boolean {
    return this.scoredProducts.has(userId)
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    return {
      productsLoaded: this.products !== null,
      productCount: this.products?.length ?? 0,
      fetchInProgress: this.fetchPromise !== null,
      scoredProductsCached: this.scoredProducts.size,
      cachedFollicleIds: Array.from(this.scoredProducts.keys()),
      scoredProductCounts: Array.from(this.scoredProducts.entries()).map(
        ([id, scores]) => ({ userId: id, count: scores.length })
      ),
    }
  }
}

export const productsCache = ProductsCache.getInstance()
