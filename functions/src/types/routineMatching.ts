import { Routine } from './routine'



export interface RoutineMatchScore {
  routine: Routine
  totalScore: number
  breakdown: {
    productScore: number
    engagementScore: number
  }
  matchReasons: string[]
  interactionsByTier?: {
    exact: { adapt: number; save: number; like: number }
    veryHigh: { adapt: number; save: number; like: number }
    high: { adapt: number; save: number; like: number }
    medium: { adapt: number; save: number; like: number }
  }
}
