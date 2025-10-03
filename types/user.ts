export interface User {
  userId: string
  email: string
  // Optional photo (keeping for later)
  photoUrl?: string
  follicleId: string // Generated from hairAnalysis values
  quizComplete: Date
  createdAt: Date
  hairAnalysis: HairAnalysis
}

export interface HairAnalysis {
  hairType: 'straight' | 'wavy' | 'curly' | 'coily' | 'protective'
  porosity: 'low' | 'medium' | 'high'
  density: 'low' | 'medium' | 'high'
  thickness: 'fine' | 'medium' | 'coarse'
  damage: 'none' | 'some' | 'severe'
  // Optional ML classification (keeping for later)
  mlClassification?: {
    confidence: number
    predictions: Record<string, number>
  }
}
