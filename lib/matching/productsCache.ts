import { Product } from '@/types/product'

// Global singleton cache
class ProductsCache {
  private static instance: ProductsCache
  private products: Product[] | null = null
  private fetchPromise: Promise<Product[]> | null = null

  private constructor() {}

  static getInstance(): ProductsCache {
    if (!ProductsCache.instance) {
      ProductsCache.instance = new ProductsCache()
    }
    return ProductsCache.instance
  }

  async getProducts(): Promise<Product[]> {
    // If we have products, return them
    if (this.products) {
      console.log('✅ Using cached products')
      return this.products
    }

    // If a fetch is in progress, wait for it
    if (this.fetchPromise) {
      console.log('⏳ Waiting for in-progress fetch...')
      return this.fetchPromise
    }

    // Start a new fetch
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
      const products: Product[] = data.products // Explicitly type as Product[]
      this.products = products
      console.log(`✅ Cached ${products.length} products`)

      return products // Return the typed variable
    } catch (error) {
      throw error
    } finally {
      this.fetchPromise = null
    }
  }

  // For prefetching (fire and forget)
  prefetch(): void {
    this.getProducts().catch((err) => {
      console.error('Prefetch failed:', err)
    })
  }
}

export const productsCache = ProductsCache.getInstance()
