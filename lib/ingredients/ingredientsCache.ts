import { Ingredient } from '@/types/ingredient'

/**
 * IngredientsCache - In-memory caching for ingredients
 *
 * Same pattern as ProductsCache but for ingredients
 * No scoring cache needed (ingredients don't have match scores)
 */
class IngredientsCache {
  private static instance: IngredientsCache

  // Ingredients cache
  private ingredients: Ingredient[] | null = null
  private fetchPromise: Promise<Ingredient[]> | null = null

  private constructor() {}

  static getInstance(): IngredientsCache {
    if (!IngredientsCache.instance) {
      IngredientsCache.instance = new IngredientsCache()
    }
    return IngredientsCache.instance
  }

  /**
   * Get all ingredients
   * - First call: fetches from API
   * - Subsequent calls: returns cached copy
   * - Cache persists only during current page session
   */
  async getIngredients(): Promise<Ingredient[]> {
    if (this.ingredients) {
      console.log('✅ Using cached ingredients from memory')
      return this.ingredients
    }

    if (this.fetchPromise) {
      console.log('⏳ Waiting for in-progress fetch...')
      return this.fetchPromise
    }

    console.log('🚀 Fetching ingredients from API...')
    this.fetchPromise = this.fetchFromAPI()

    return this.fetchPromise
  }

  /**
   * Fetch ingredients from API
   */
  private async fetchFromAPI(): Promise<Ingredient[]> {
    try {
      const response = await fetch('/api/ingredients')

      if (!response.ok) {
        throw new Error('Failed to fetch ingredients')
      }

      const data = await response.json()
      const ingredients: Ingredient[] = data.ingredients

      this.ingredients = ingredients

      const cacheStatus = data.cached
        ? '(from server cache)'
        : '(fresh from Firestore)'
      console.log(`✅ Loaded ${ingredients.length} ingredients ${cacheStatus}`)

      return ingredients
    } catch (error) {
      console.error('Error fetching ingredients:', error)
      throw error
    } finally {
      this.fetchPromise = null
    }
  }

  /**
   * Get unique function types for filtering
   * Derived from cached ingredients
   */
  getFunctionTypes(): string[] {
    if (!this.ingredients) return []

    const types = new Set<string>()
    this.ingredients.forEach((i) => {
      if (i.functionType) types.add(i.functionType)
    })
    return Array.from(types).sort()
  }

  /**
   * Prefetch ingredients in background
   */
  prefetch(): void {
    this.getIngredients().catch((err) => {
      console.error('Prefetch failed:', err)
    })
  }

  /**
   * Clear ingredients cache
   */
  clearIngredients(): void {
    this.ingredients = null
    console.log('🗑️ Cleared ingredients cache')
  }

  /**
   * Check if ingredients are currently cached
   */
  hasCachedIngredients(): boolean {
    return this.ingredients !== null
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    return {
      ingredientsLoaded: this.ingredients !== null,
      ingredientCount: this.ingredients?.length ?? 0,
      fetchInProgress: this.fetchPromise !== null,
      functionTypeCount: this.getFunctionTypes().length,
    }
  }
}

export const ingredientsCache = IngredientsCache.getInstance()