import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type {
  InteractionType,
  UserProductInteractions,
} from '@/types/productInteraction'
import type { User } from '@/types/user'

export function useProductInteraction(productId: string) {
  const { user: authUser } = useAuth() // Firebase Auth user
  const [firestoreUser, setFirestoreUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Track current interaction state for this product
  const [interactions, setInteractions] = useState<UserProductInteractions>({
    like: false,
    dislike: false,
    save: false,
    view: false,
    routine: false,
    reroll: false,
  })

  /**
   * Fetch Firestore user document to get follicleId and cache arrays
   */
  const fetchFirestoreUser = useCallback(async () => {
    if (!authUser?.uid) {
      setFirestoreUser(null)
      setIsReady(false)
      return
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', authUser.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        setFirestoreUser(userData)
        setIsReady(!!userData.follicleId)
      }
    } catch (error) {
      console.error('Failed to fetch user document:', error)
      setIsReady(false)
    }
  }, [authUser])

  useEffect(() => {
    fetchFirestoreUser()
  }, [fetchFirestoreUser])

  /**
   * Initialize interaction state from user cache arrays
   */
  useEffect(() => {
    if (!firestoreUser || !productId) return

    setInteractions({
      like: firestoreUser.likedProducts?.includes(productId) ?? false,
      dislike: firestoreUser.dislikedProducts?.includes(productId) ?? false,
      save: firestoreUser.savedProducts?.includes(productId) ?? false,
      view: false,
      routine: false,
      reroll: false,
    })
  }, [firestoreUser, productId])

  /**
   * Generic interaction handler
   */
  const interact = useCallback(
    async (type: InteractionType, shouldDelete: boolean = false) => {
      if (!authUser?.uid || !firestoreUser?.follicleId) {
        console.warn('User must be logged in with follicleId to interact')
        return { success: false, error: 'Not authenticated' }
      }

      // Optimistic update
      const previousState = interactions[type]
      setInteractions((prev) => ({ ...prev, [type]: !previousState }))
      setIsLoading(true)

      try {
        const token = await authUser.getIdToken()
        let response

        if (shouldDelete) {
          response = await fetch(
            `/api/interactions/products/${productId}/${type}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        } else {
          response = await fetch('/api/interactions/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              // Don't send userId - server gets it from token
              productId,
              follicleId: firestoreUser.follicleId,
              type,
            }),
          })
        }

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
        console.error('Interaction failed:', errorMessage)

        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [authUser, firestoreUser, productId, interactions, fetchFirestoreUser]
  )

  /**
   * Toggle like (removes dislike if adding like)
   */
  const toggleLike = useCallback(async () => {
    const isCurrentlyLiked = interactions.like
    const isCurrentlyDisliked = interactions.dislike

    // If adding like, also remove dislike optimistically
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

    // If adding dislike, also remove like optimistically
    if (!isCurrentlyDisliked && isCurrentlyLiked) {
      setInteractions((prev) => ({ ...prev, like: false }))
    }

    return interact('dislike', isCurrentlyDisliked)
  }, [interactions.like, interactions.dislike, interact])

  /**
   * Toggle save
   */
  const toggleSave = useCallback(async () => {
    return interact('save', interactions.save)
  }, [interactions.save, interact])

  /**
   * Toggle routine (product added to/removed from routine)
   */
  const toggleRoutine = useCallback(async () => {
    return interact('routine', interactions.routine)
  }, [interactions.routine, interact])

  /**
   * Track view (allow multiple views)
   */
  const trackView = useCallback(async () => {
    // Don't update local state for views (we don't cache them)
    return interact('view', false)
  }, [interact])

  return {
    // State
    interactions,
    isLoading,
    isReady,

    // Actions
    toggleLike,
    toggleDislike,
    toggleSave,
    toggleRoutine,
    trackView,
  }
}
