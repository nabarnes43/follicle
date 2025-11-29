import { Timestamp, FieldValue } from 'firebase/firestore'

export type IngredientInteractionType =
  | 'like'
  | 'dislike'
  | 'avoid'
  | 'allergic'
  | 'view'

export interface IngredientInteraction {
  id?: string
  userId: string
  ingredientId: string
  follicleId: string
  type: IngredientInteractionType
  timestamp: Timestamp | FieldValue
}

/**
 * Client-side helper - tracks user's interactions with a specific ingredient
 * Used for UI state (showing which buttons are active)
 */
export interface UserIngredientInteractions {
  like: boolean
  dislike: boolean
  avoid: boolean
  allergic: boolean
  view: boolean
}