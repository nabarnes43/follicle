export type InteractionType = 'like' | 'dislike' | 'save' | 'view'

export interface ProductInteraction {
  userId: string
  follicleId: string
  productId: string
  type: InteractionType // ← Uses the type above
  hairType: string
  timestamp: number
}
