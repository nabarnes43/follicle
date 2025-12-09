import { Timestamp, FieldValue } from 'firebase/firestore'

export type RoutineInteractionType =
  | 'like'
  | 'dislike'
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
  save: boolean
  view: boolean
}

//Adapt is handled as crud interaction these are user layer
