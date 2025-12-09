import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type {
  RoutineInteractionType,
  UserRoutineInteractions,
} from '@/types/routineInteraction'
import type { User } from '@/types/user'

export function useRoutineInteraction(routineId: string) {
  const { user: authUser } = useAuth()
  const [firestoreUser, setFirestoreUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Derive interaction state from user cache arrays
  const [interactions, setInteractions] = useState<UserRoutineInteractions>({
    like: false,
    dislike: false,
    save: false,
    view: false,
  })

  /**
   * Fetch Firestore user to get follicleId and cache arrays
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
   * Sync local state from Firestore user cache
   */
  useEffect(() => {
    if (!firestoreUser || !routineId) return

    setInteractions({
      like: firestoreUser.likedRoutines?.includes(routineId) ?? false,
      dislike: firestoreUser.dislikedRoutines?.includes(routineId) ?? false,
      save: firestoreUser.savedRoutines?.includes(routineId) ?? false,
      view: false,
    })
  }, [firestoreUser, routineId])

  /**
   * Generic mutation handler with optimistic updates
   * Automatically determines POST vs DELETE based on current state
   */
  const mutate = useCallback(
    async (type: RoutineInteractionType) => {
      if (!authUser?.uid || !firestoreUser?.follicleId) {
        console.warn('User must be logged in with follicleId to interact')
        return { success: false, error: 'Not authenticated' }
      }

      const isCurrentlyActive = interactions[type]
      const method = isCurrentlyActive ? 'DELETE' : 'POST'

      // Optimistic update
      setInteractions((prev) => ({ ...prev, [type]: !isCurrentlyActive }))
      setIsLoading(true)

      try {
        const token = await authUser.getIdToken()
        const response = await fetch(
          `/api/interactions/routines/${routineId}/${type}`,
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

        // Sync with server state
        await fetchFirestoreUser()

        return { success: true, data }
      } catch (error) {
        // Rollback optimistic update on error
        setInteractions((prev) => ({ ...prev, [type]: isCurrentlyActive }))

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
   * Toggle like (auto-removes dislike due to mutual exclusivity)
   */
  const toggleLike = useCallback(async () => {
    // Handle mutual exclusivity client-side
    if (!interactions.like && interactions.dislike) {
      setInteractions((prev) => ({ ...prev, dislike: false }))
    }
    return mutate('like')
  }, [interactions.like, interactions.dislike, mutate])

  /**
   * Toggle dislike (auto-removes like due to mutual exclusivity)
   */
  const toggleDislike = useCallback(async () => {
    // Handle mutual exclusivity client-side
    if (!interactions.dislike && interactions.like) {
      setInteractions((prev) => ({ ...prev, like: false }))
    }
    return mutate('dislike')
  }, [interactions.like, interactions.dislike, mutate])

  /**
   * Toggle save
   */
  const toggleSave = useCallback(() => mutate('save'), [mutate])

  /**
   * Track view (fire-and-forget, no state update)
   */
  const trackView = useCallback(() => mutate('view'), [mutate])

  return {
    // State
    interactions,
    isLoading,
    isReady,

    // Actions
    toggleLike,
    toggleDislike,
    toggleSave,
    trackView,
  }
}
