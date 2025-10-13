import { Product } from '@/types/product'
import { MatchScore } from '@/types/matching'

/**
 * ProductsCache - Simple in-memory caching for products API calls
 *
 * Why cache products?
 * - Products are fetched from server (which has its own cache)
 * - Prevents redundant API calls during the same page session
 * - Cache is cleared on page refresh (intentional - ensures fresh data)
 * -  No repeated API calls during navigation (in-memory cache)
 *
 * Why NOT cache scored products?
 * - Scores are based on engagement stats that change frequently
 * - During testing, we want fresh scores on every refresh
 * - Matching algorithm is fast enough to recalculate on demand
 */
class ProductsCache {
  private static instance: ProductsCache

  // In-memory cache for products (cleared on page refresh)
  private products: Product[] | null = null
  private fetchPromise: Promise<Product[]> | null = null

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
    // Return cached products if available
    if (this.products) {
      console.log('✅ Using cached products from memory')
      return this.products
    }

    // If fetch is already in progress, wait for it
    if (this.fetchPromise) {
      console.log('⏳ Waiting for in-progress fetch...')
      return this.fetchPromise
    }

    // Start new fetch
    console.log('🚀 Fetching products from API...')
    this.fetchPromise = this.fetchFromAPI()

    return this.fetchPromise
  }

  /**
   * Fetch products from API
   * Server has its own cache, so this is fast after first request
   */
  private async fetchFromAPI(): Promise<Product[]> {
    try {
      const response = await fetch('/api/products')

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      const products: Product[] = data.products

      // Cache in memory for this session
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
   * Prefetch products in background
   * Useful to call early in app lifecycle
   */
  prefetch(): void {
    this.getProducts().catch((err) => {
      console.error('Prefetch failed:', err)
    })
  }

  /**
   * Clear products cache
   * Useful for testing or forcing a refresh
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
   * Get cache stats for debugging
   */
  getCacheStats() {
    return {
      productsLoaded: this.products !== null,
      productCount: this.products?.length ?? 0,
      fetchInProgress: this.fetchPromise !== null,
    }
  }
}

export const productsCache = ProductsCache.getInstance()
