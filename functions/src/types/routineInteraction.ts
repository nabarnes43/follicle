export type RoutineInteractionType =
  | 'like'
  | 'dislike'
  | 'save'
  | 'view'
  | 'adapt'

export interface RoutineInteraction {
  id: string
  userId: string
  follicleId: string
  routineId: string
  type: RoutineInteractionType
  timestamp: any
}
