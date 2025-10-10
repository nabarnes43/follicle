import { Product } from '@/types/product'
import { MatchScore } from '@/types/matching'

type ScoreCacheKey = string

// Compressed format for sessionStorage
// Uses single letters to minimize storage size
interface CompressedMatchScore {
  id: string // Product ID
  s: number // totalScore
  b: [number, number] // [ingredientScore, engagementScore]
  r: string[] // matchReasons
  // Similarity metrics (optional, only if data exists)
  sm?: {
    e: number // exact matches
    vh: number // veryHigh similarity
    h: number // high similarity
    m: number // medium similarity
    t: number // totalSimilar
  }
}

// Helper to check sessionStorage availability
function isSessionStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    sessionStorage.setItem(test, test)
    sessionStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

class ProductsCache {
  private static instance: ProductsCache
  private products: Product[] | null = null
  private fetchPromise: Promise<Product[]> | null = null

  // In-memory cache (fast, lost on refresh)
  private scoredProducts: Map<ScoreCacheKey, MatchScore[]> = new Map()

  // SessionStorage key prefix
  private readonly SCORE_CACHE_PREFIX = 'follicle_scores_'

  private constructor() {
    // Restore from sessionStorage happens lazily when getScoredProducts is called
  }

  static getInstance(): ProductsCache {
    if (!ProductsCache.instance) {
      ProductsCache.instance = new ProductsCache()
    }
    return ProductsCache.instance
  }

  async getProducts(): Promise<Product[]> {
    if (this.products) {
      console.log('✅ Using cached products')
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

  private async fetchFromAPI(): Promise<Product[]> {
    try {
      const response = await fetch('/api/products')

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      const products: Product[] = data.products
      this.products = products
      console.log(`✅ Cached ${products.length} products`)

      return products
    } catch (error) {
      throw error
    } finally {
      this.fetchPromise = null
    }
  }

  prefetch(): void {
    this.getProducts().catch((err) => {
      console.error('Prefetch failed:', err)
    })
  }

  /**
   * Compress MatchScore array to save sessionStorage space
   * Converts full MatchScore objects to minimal compressed format
   * Includes similarityMetrics if present
   */
  private compress(scored: MatchScore[]): CompressedMatchScore[] {
    return scored.map((match) => {
      const compressed: CompressedMatchScore = {
        id: match.product.id,
        s: match.totalScore,
        b: [match.breakdown.ingredientScore, match.breakdown.engagementScore],
        r: match.matchReasons,
      }

      // Only include similarity metrics if they exist
      if (match.similarityMetrics) {
        compressed.sm = {
          e: match.similarityMetrics.exact,
          vh: match.similarityMetrics.veryHigh,
          h: match.similarityMetrics.high,
          m: match.similarityMetrics.medium,
          t: match.similarityMetrics.totalSimilar,
        }
      }

      return compressed
    })
  }

  /**
   * Decompress back to full MatchScore array
   * Looks up full product data and reconstructs MatchScore objects
   * Restores similarityMetrics if they were stored
   */
  private decompress(compressed: CompressedMatchScore[]): MatchScore[] | null {
    // Need products to look up full product data
    if (!this.products) {
      console.warn('Cannot decompress without products loaded')
      return null
    }

    return compressed
      .map((c) => {
        const product = this.products!.find((p) => p.id === c.id)

        if (!product) {
          console.warn(`Product ${c.id} not found in products list`)
          return null
        }

        const matchScore: MatchScore = {
          product,
          totalScore: c.s,
          breakdown: {
            ingredientScore: c.b[0],
            engagementScore: c.b[1],
          },
          matchReasons: c.r,
        }

        // Restore similarity metrics if they exist
        if (c.sm) {
          matchScore.similarityMetrics = {
            exact: c.sm.e,
            veryHigh: c.sm.vh,
            high: c.sm.h,
            medium: c.sm.m,
            totalSimilar: c.sm.t,
          }
        }

        return matchScore
      })
      .filter((m): m is MatchScore => m !== null)
  }

  /**
   * Get scored products from cache
   * Checks memory first (fastest), then sessionStorage
   * Returns null if no cache exists for this user + follicleId combo
   */
  getScoredProducts(userId: string, follicleId: string): MatchScore[] | null {
    const key = `${userId}_${follicleId}`
    console.log('🔍 Looking for cached scores with key:', key)

    // 1. Try memory cache first (fastest)
    const memoryCache = this.scoredProducts.get(key)
    if (memoryCache) {
      console.log(
        `✅ Using in-memory cached scores (${memoryCache.length} products)`
      )
      return memoryCache
    }

    // 2. Try sessionStorage fallback (survives component remounts)
    if (isSessionStorageAvailable()) {
      const storageKey = this.SCORE_CACHE_PREFIX + key
      const stored = sessionStorage.getItem(storageKey)

      if (stored) {
        try {
          const compressed = JSON.parse(stored) as CompressedMatchScore[]
          console.log(
            `🔄 Found ${compressed.length} compressed scores in sessionStorage`
          )

          // Decompress back to full MatchScore objects
          const decompressed = this.decompress(compressed)

          if (decompressed) {
            console.log(
              `✅ Decompressed ${decompressed.length} scores from sessionStorage`
            )

            // Restore to memory cache for next time (faster access)
            this.scoredProducts.set(key, decompressed)

            return decompressed
          }
        } catch (error) {
          console.error('Failed to parse sessionStorage cache:', error)
          // Clean up corrupted data
          sessionStorage.removeItem(storageKey)
        }
      }
    }

    console.log(`❌ No cached scores found for key: ${key}`)
    return null
  }

  /**
   * Set scored products in cache
   * Saves to both memory (fast) and sessionStorage (persistent across remounts)
   * Compresses data before storing to save space
   */
  setScoredProducts(
    userId: string,
    follicleId: string,
    scored: MatchScore[]
  ): void {
    const key = `${userId}_${follicleId}`

    // 1. Save to memory cache (full data, instant access)
    this.scoredProducts.set(key, scored)
    console.log(`✅ Cached ${scored.length} scored products in memory`)

    // 2. Save to sessionStorage (compressed to save space)
    if (isSessionStorageAvailable()) {
      try {
        const compressed = this.compress(scored)
        const storageKey = this.SCORE_CACHE_PREFIX + key
        const json = JSON.stringify(compressed)

        // Log compression efficiency
        const originalSize = JSON.stringify(scored).length
        const compressedSize = json.length
        const savings = Math.round((1 - compressedSize / originalSize) * 100)
        console.log(
          `📦 Compressed to ${Math.round(compressedSize / 1024)}KB (${savings}% smaller)`
        )

        sessionStorage.setItem(storageKey, json)
        console.log(
          `✅ Cached ${scored.length} compressed scores in sessionStorage`
        )
      } catch (error) {
        // Likely quota exceeded (sessionStorage is ~5-10MB)
        console.warn(
          'Failed to cache to sessionStorage (quota exceeded):',
          error
        )
        // Continue anyway - memory cache still works until page refresh
      }
    }

    console.log(
      '📊 Cache now has',
      this.scoredProducts.size,
      'entries in memory'
    )
  }

  /**
   * Clear scored products cache
   * Can clear for specific user or all users
   * Clears both memory and sessionStorage
   */
  clearScoredProducts(userId?: string): void {
    if (userId) {
      // Clear for specific user (all their follicleId variations)
      const keysToDelete = Array.from(this.scoredProducts.keys()).filter(
        (key) => key.startsWith(userId)
      )
      keysToDelete.forEach((key) => {
        this.scoredProducts.delete(key)

        // Also clear from sessionStorage
        if (isSessionStorageAvailable()) {
          sessionStorage.removeItem(this.SCORE_CACHE_PREFIX + key)
        }
      })
      console.log(`🗑️ Cleared scored products cache for user ${userId}`)
    } else {
      // Clear all users
      this.scoredProducts.clear()

      // Clear all from sessionStorage
      if (isSessionStorageAvailable()) {
        const keysToRemove: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key?.startsWith(this.SCORE_CACHE_PREFIX)) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach((key) => sessionStorage.removeItem(key))
      }

      console.log('🗑️ Cleared all scored products cache')
    }
  }
}

export const productsCache = ProductsCache.getInstance()
