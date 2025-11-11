import { Routine } from '@/types/routine'
import { RoutineMatchScore } from '@/types/routineMatching'

/**
 * RoutinesCache - In-memory caching for routines and match scores
 *
 * Same pattern as ProductsCache but for routines
 *
 * Routines Cache:
 * - Prevents redundant API calls during same page session
 * - Cleared on page refresh (ensures fresh data)
 *
 * Match Scores Cache:
 * - Prevents expensive recalculation on tab switches
 * - Keyed by userId (scores use user's full profile + engagement data)
 * - Cleared when user updates profile or on page refresh
 */
class RoutinesCache {
  private static instance: RoutinesCache

  // Routines cache
  private routines: Routine[] | null = null
  private fetchPromise: Promise<Routine[]> | null = null

  // Match scores cache - keyed by userId
  private scoredRoutines: Map<string, RoutineMatchScore[]> = new Map()

  private constructor() {}

  static getInstance(): RoutinesCache {
    if (!RoutinesCache.instance) {
      RoutinesCache.instance = new RoutinesCache()
    }
    return RoutinesCache.instance
  }

  /**
   * Get all routines
   * - First call: fetches from API
   * - Subsequent calls: returns cached copy
   * - Cache persists only during current page session
   */
  async getRoutines(): Promise<Routine[]> {
    if (this.routines) {
      console.log('✅ Using cached routines from memory')
      return this.routines
    }

    if (this.fetchPromise) {
      console.log('⏳ Waiting for in-progress fetch...')
      return this.fetchPromise
    }

    console.log('🚀 Fetching routines from API...')
    this.fetchPromise = this.fetchFromAPI()

    return this.fetchPromise
  }

  /**
   * Fetch routines from API
   */
  private async fetchFromAPI(): Promise<Routine[]> {
    try {
      const response = await fetch('/api/routines/public')

      if (!response.ok) {
        throw new Error('Failed to fetch routines')
      }

      const data = await response.json()
      const routines: Routine[] = data.routines

      this.routines = routines

      console.log(`✅ Loaded ${routines.length} routines`)

      return routines
    } catch (error) {
      console.error('Error fetching routines:', error)
      throw error
    } finally {
      this.fetchPromise = null
    }
  }

  /**
   * Get ALL scored routines for a user
   * Returns null if not cached
   */
  getAllScoredRoutines(userId: string): RoutineMatchScore[] | null {
    const cached = this.scoredRoutines.get(userId)
    if (cached) {
      console.log(
        `✅ Using cached routine scores for userId: ${userId} (${cached.length} routines)`
      )
    }
    return cached || null
  }

  /**
   * Get scored routines filtered by routine IDs
   * Returns null if full cache doesn't exist
   */
  getScoredRoutines(
    userId: string,
    routineIds?: string[]
  ): RoutineMatchScore[] | null {
    const allScored = this.getAllScoredRoutines(userId)
    if (!allScored) return null

    // If no filter, return all
    if (!routineIds || routineIds.length === 0) return allScored

    // Filter by routine IDs
    const idSet = new Set(routineIds)
    const filtered = allScored.filter((m) => idSet.has(m.routine.id))

    console.log(
      `✅ Filtered ${filtered.length}/${allScored.length} cached routine scores for userId: ${userId}`
    )
    return filtered
  }

  /**
   * Cache ALL scored routines for a user
   */
  setAllScoredRoutines(userId: string, scored: RoutineMatchScore[]): void {
    this.scoredRoutines.set(userId, scored)
    console.log(
      `💾 Cached ${scored.length} scored routines for userId: ${userId}`
    )
  }

  /**
   * Clear scored routines cache for a specific user
   * Call this when user updates their hair profile
   */
  clearScoredRoutines(userId: string): void {
    this.scoredRoutines.delete(userId)
    console.log(`🗑️ Cleared scored routines cache for userId: ${userId}`)
  }

  /**
   * Clear all scored routines (all users)
   */
  clearAllScoredRoutines(): void {
    this.scoredRoutines.clear()
    console.log('🗑️ Cleared all scored routines cache')
  }

  /**
   * Prefetch routines in background
   */
  prefetch(): void {
    this.getRoutines().catch((err) => {
      console.error('Prefetch failed:', err)
    })
  }

  /**
   * Clear routines cache
   */
  clearRoutines(): void {
    this.routines = null
    console.log('🗑️ Cleared routines cache')
  }

  /**
   * Check if routines are currently cached
   */
  hasCachedRoutines(): boolean {
    return this.routines !== null
  }

  /**
   * Check if scores are cached for a user
   */
  hasCachedScores(userId: string): boolean {
    return this.scoredRoutines.has(userId)
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats() {
    return {
      routinesLoaded: this.routines !== null,
      routineCount: this.routines?.length ?? 0,
      fetchInProgress: this.fetchPromise !== null,
      scoredRoutinesCached: this.scoredRoutines.size,
      cachedUserIds: Array.from(this.scoredRoutines.keys()),
      scoredRoutineCounts: Array.from(this.scoredRoutines.entries()).map(
        ([id, scores]) => ({ userId: id, count: scores.length })
      ),
    }
  }
}

export const routinesCache = RoutinesCache.getInstance()
