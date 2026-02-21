// functions/src/types/user.ts
// Copied from types/user.ts - removed Firestore imports (not needed for scoring)

export interface User {
  userId: string
  email: string | null
  photoUrl: string | null
  displayName?: string | null
  follicleId: string
  analysisComplete: any | null // Simplified - was Timestamp | FieldValue
  createdAt: any
  hairAnalysis?: HairAnalysis
  isAnonymous: boolean
  providerData: ProviderData[]
  lastLoginAt: any
  likedProducts?: string[]
  dislikedProducts?: string[]
  routineProducts?: string[]
  savedProducts?: string[]
  savedRoutines?: string[]
  likedRoutines?: string[]
  dislikedRoutines?: string[]
  adaptedRoutines?: string[]
  likedIngredients?: string[]
  dislikedIngredients?: string[]
  avoidIngredients?: string[]
  allergicIngredients?: string[]
}

export interface ProviderData {
  providerId: string
  email?: string | null
  displayName?: string | null
  photoURL?: string | null
  uid?: string
  phoneNumber?: string | null
}

export interface HairAnalysis {
  hairType: 'straight' | 'wavy' | 'curly' | 'coily' | 'protective'
  porosity: 'low' | 'medium' | 'high'
  density: 'low' | 'medium' | 'high'
  thickness: 'fine' | 'medium' | 'coarse'
  damage: 'none' | 'some' | 'severe'
  length?: 'short' | 'medium' | 'long'
  scalpType?: 'dry' | 'balanced' | 'oily'
  mainGoal?: 'moisture' | 'definition' | 'growth' | 'repair' | 'volume'
  washFrequency?: 'daily' | 'every2-3' | 'weekly' | 'biweekly'
  mlClassification?: {
    confidence: number
    predictions: Record<string, number>
  }
}
