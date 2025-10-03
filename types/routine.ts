export interface Routine {
  routineId: string
  userId: string
  creatorName: string
  follicleId: string // Matches users with same hairAnalysis
  title: string
  description: string
  steps: RoutineStep[]
  frequency: string
  visibility: 'public' | 'private'
  engagementStats: EngagementStats
  createdAt: Date
  updatedAt?: Date // Optional for tracking edits
}

export interface RoutineStep {
  order: number
  type: 'shampoo' | 'condition' | 'style' | 'treatment' | 'detangle' | 'other'
  productId: string
  amount: string // e.g., "dime-sized", "quarter-sized", "2 pumps"
  technique: string // e.g., "scrunch", "rake through", "prayer hands"
  notes?: string // Optional additional notes
}

export interface EngagementStats {
  straight: HairTypeEngagement
  wavy: HairTypeEngagement
  curly: HairTypeEngagement
  coily: HairTypeEngagement
  protective: HairTypeEngagement
}

export interface HairTypeEngagement {
  saves: number
  tries: number
  success: number
}
