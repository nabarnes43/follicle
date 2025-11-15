import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type {
  RoutineInteractionType,
  UserRoutineInteractions,
} from '@/types/routineInteraction'
import type { User } from '@/types/user'

/**
 * Hook for managing routine interactions (like, dislike, adapt, save, view)
 *
 * Pattern matches useProductInteraction but for routines
 * Uses user cache arrays for fast UI updates
 *
 * @param routineId - The routine to interact with
 * @returns interaction state and toggle functions
 */
export function useRoutineInteraction(routineId: string) {
  const { user: authUser } = useAuth() // Firebase Auth user
  const [firestoreUser, setFirestoreUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Track current interaction state for this routine
  const [interactions, setInteractions] = useState<UserRoutineInteractions>({
    like: false,
    dislike: false,
    adapt: false,
    save: false,
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
    if (!firestoreUser || !routineId) return

    setInteractions({
      like: firestoreUser.likedRoutines?.includes(routineId) ?? false,
      dislike: firestoreUser.dislikedRoutines?.includes(routineId) ?? false,
      adapt: firestoreUser.adaptedRoutines?.includes(routineId) ?? false,
      save: firestoreUser.savedRoutines?.includes(routineId) ?? false,
      view: false,
    })
  }, [firestoreUser, routineId])

  /**
   * Generic interaction handler
   * Handles optimistic updates and rollback on error
   */
  const interact = useCallback(
    async (type: RoutineInteractionType, shouldDelete: boolean = false) => {
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
            `/api/interactions/routines/${routineId}/${type}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        } else {
          response = await fetch('/api/interactions/routines', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              routineId,
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
        console.error('Routine interaction failed:', errorMessage)

        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [authUser, firestoreUser, routineId, interactions, fetchFirestoreUser]
  )

  /**
   * Toggle like (removes dislike if adding like)
   * Like and Dislike are mutually exclusive
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
   * Like and Dislike are mutually exclusive
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
   * Toggle adapt (user copied this routine to their own)
   * Strong positive signal - they're actually using it
   */
  const toggleAdapt = useCallback(async () => {
    return interact('adapt', interactions.adapt)
  }, [interactions.adapt, interact])

  /**
   * Toggle save (user bookmarked for later)
   */
  const toggleSave = useCallback(async () => {
    return interact('save', interactions.save)
  }, [interactions.save, interact])

  /**
   * Track view (allow multiple views)
   * Used for calculating engagement rates
   */
  const trackView = useCallback(async () => {
    // Don't update local state for views (we don't cache them)
    return interact('view', false)
  }, [interact])

  return {
    // State
    interactions,
    isLoading,

    // Actions
    toggleLike,
    toggleDislike,
    toggleAdapt,
    toggleSave,
    trackView,
  }
}
