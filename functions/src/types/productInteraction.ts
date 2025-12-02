// functions/src/types/productInteraction.ts
// Simplified - removed Firestore imports

export type InteractionType =
  | 'like'
  | 'dislike'
  | 'save'
  | 'view'
  | 'routine'
  | 'reroll'

export interface ProductInteraction {
  id: string
  userId: string
  follicleId: string
  productId: string
  type: InteractionType
  routineId?: string
  timestamp: any // Simplified - was Timestamp | FieldValue
}

export interface UserProductInteractions {
  like: boolean
  dislike: boolean
  save: boolean
  view: boolean
  routine: boolean
  reroll: boolean
}
