import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type {
  IngredientInteractionType,
  UserIngredientInteractions,
} from '@/types/ingredientInteraction'
import type { User } from '@/types/user'

/**
 * Hook for managing ingredient interactions (like, dislike, avoid, allergic, view)
 *
 * @param ingredientId - The ingredient to interact with
 * @returns interaction state and toggle functions
 */
export function useIngredientInteraction(ingredientId: string) {
  const { user: authUser } = useAuth()
  const [firestoreUser, setFirestoreUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [interactions, setInteractions] = useState<UserIngredientInteractions>({
    like: false,
    dislike: false,
    avoid: false,
    allergic: false,
    view: false,
  })

  /**
   * Fetch Firestore user document to get follicleId and cache arrays
   */
  const fetchFirestoreUser = useCallback(async () => {
    if (!authUser?.uid) {
      setFirestoreUser(null)
      return
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', authUser.uid))
      if (userDoc.exists()) {
        setFirestoreUser(userDoc.data() as User)
      }
    } catch (error) {
      console.error('Failed to fetch user document:', error)
    }
  }, [authUser])

  useEffect(() => {
    fetchFirestoreUser()
  }, [fetchFirestoreUser])

  /**
   * Initialize interaction state from user cache arrays
   */
  useEffect(() => {
    if (!firestoreUser || !ingredientId) return

    setInteractions({
      like: firestoreUser.likedIngredients?.includes(ingredientId) ?? false,
      dislike:
        firestoreUser.dislikedIngredients?.includes(ingredientId) ?? false,
      avoid: firestoreUser.avoidIngredients?.includes(ingredientId) ?? false,
      allergic:
        firestoreUser.allergicIngredients?.includes(ingredientId) ?? false,
      view: false,
    })
  }, [firestoreUser, ingredientId])

  /**
   * Generic interaction handler
   */
  const interact = useCallback(
    async (type: IngredientInteractionType, shouldDelete: boolean = false) => {
      if (!authUser?.uid) {
        console.warn('User must be logged in to interact')
        return { success: false, error: 'Not authenticated' }
      }

      // Optimistic update
      const previousState = interactions[type]
      setInteractions((prev) => ({ ...prev, [type]: !previousState }))
      setIsLoading(true)

      try {
        const token = await authUser.getIdToken()
        const method = shouldDelete ? 'DELETE' : 'POST'

        const response = await fetch(
          `/api/interactions/ingredients/${ingredientId}/${type}`,
          {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Request failed')
        }

        // Refetch user to sync cache arrays
        await fetchFirestoreUser()

        return { success: true, data }
      } catch (error) {
        // Rollback optimistic update
        setInteractions((prev) => ({ ...prev, [type]: previousState }))

        const errorMessage =
          error instanceof Error ? error.message : 'Request failed'
        console.error('Ingredient interaction failed:', errorMessage)

        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [authUser, ingredientId, interactions, fetchFirestoreUser]
  )

  /**
   * Toggle like (removes dislike if adding like)
   */
  const toggleLike = useCallback(async () => {
    const isCurrentlyLiked = interactions.like
    const isCurrentlyDisliked = interactions.dislike

    if (!isCurrentlyLiked && isCurrentlyDisliked) {
      setInteractions((prev) => ({ ...prev, dislike: false }))
    }

    return interact('like', isCurrentlyLiked)
  }, [interactions.like, interactions.dislike, interact])

  /**
   * Toggle dislike (removes like if adding dislike)
   */
  const toggleDislike = useCallback(async () => {
    const isCurrentlyDisliked = interactions.dislike
    const isCurrentlyLiked = interactions.like

    if (!isCurrentlyDisliked && isCurrentlyLiked) {
      setInteractions((prev) => ({ ...prev, like: false }))
    }

    return interact('dislike', isCurrentlyDisliked)
  }, [interactions.like, interactions.dislike, interact])

  /**
   * Toggle avoid
   */
  const toggleAvoid = useCallback(async () => {
    return interact('avoid', interactions.avoid)
  }, [interactions.avoid, interact])

  /**
   * Toggle allergic
   */
  const toggleAllergic = useCallback(async () => {
    return interact('allergic', interactions.allergic)
  }, [interactions.allergic, interact])

  /**
   * Track view (allow multiple views)
   */
  const trackView = useCallback(async () => {
    return interact('view', false)
  }, [interact])

  return {
    // State
    interactions,
    isLoading,

    // Actions
    toggleLike,
    toggleDislike,
    toggleAvoid,
    toggleAllergic,
    trackView,
  }
}
