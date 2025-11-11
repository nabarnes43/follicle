import { Timestamp, FieldValue } from 'firebase/firestore'

export type InteractionType = 'like' | 'dislike' | 'save' | 'view' | 'routine' | 'reroll'

/**
 * ProductInteraction - User interaction with a product
 *
 * Collection: interactions
 * Document ID: Auto-generated (stored in 'id' field)
 *
 * Each interaction represents one action (like, save, etc.) by one user on one product.
 * Constraints:
 * - One interaction per (userId + productId + type) combination
 * - Like and Dislike are mutually exclusive
 */
export interface ProductInteraction {
  id: string // Firestore document ID (auto-generated)
  userId: string
  follicleId: string
  productId: string
  type: InteractionType // ← Uses the type above
  timestamp: Timestamp | FieldValue
}

/**
 * Client-side helper - tracks user's interactions with a specific product
 * Used for UI state (showing which buttons are active)
 */
export interface UserProductInteractions {
  like: boolean
  dislike: boolean
  save: boolean
  view: boolean
  routine: boolean
  reroll: boolean
}
