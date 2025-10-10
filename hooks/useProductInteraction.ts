import { useState } from 'react'
import { useAuth } from '@/contexts/auth'
import type { InteractionType } from '@/types/interaction'

export function useProductInteraction() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const interact = async (
    productId: string,
    type: InteractionType // Use the proper type!
  ) => {
    // Must be logged in
    if (!user) {
      console.warn('User must be logged in to interact with products')
      return { success: false, error: 'Not authenticated' }
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          productId,
          type,
        }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Interaction failed:', error)
      return { success: false, error: 'Request failed' }
    } finally {
      setIsLoading(false)
    }
  }

  // Convenience methods for cleaner usage
  return {
    like: (productId: string) => interact(productId, 'like'),
    dislike: (productId: string) => interact(productId, 'dislike'),
    save: (productId: string) => interact(productId, 'save'),
    view: (productId: string) => interact(productId, 'view'),
    isLoading,
  }
}
