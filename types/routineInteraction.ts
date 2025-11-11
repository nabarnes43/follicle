import { Timestamp, FieldValue } from 'firebase/firestore'

export type RoutineInteractionType =
  | 'like'
  | 'dislike'
  | 'adapt'
  | 'save'
  | 'view'

export interface RoutineInteraction {
  id: string
  userId: string
  follicleId: string
  routineId: string
  type: RoutineInteractionType
  timestamp: Timestamp | FieldValue
}

export interface UserRoutineInteractions {
  like: boolean
  dislike: boolean
  adapt: boolean
  save: boolean
  view: boolean
}
