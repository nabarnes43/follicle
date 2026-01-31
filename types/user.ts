import { Timestamp, FieldValue } from 'firebase/firestore'

export interface User {
  userId: string
  email: string | null // Remove undefined option
  photoUrl: string | null // Remove undefined option
  displayName?: string | null
  follicleId: string
  analysisComplete: Timestamp | FieldValue | null
  createdAt: Timestamp | FieldValue | null
  hairAnalysis?: HairAnalysis // This can stay optional with ?
  isAnonymous: boolean
  providerData: ProviderData[]
  lastLoginAt: Timestamp | FieldValue | null
  accessCode?: string //Access code for closed beta
  accessGrantedAt?: Date
  // Products Cache
  likedProducts?: string[] // Cache for fast UI checks
  dislikedProducts?: string[] // Cache for fast UI checks
  routineProducts?: string[]
  savedProducts?: string[]
  // Routines Cache
  createdRoutines?: string[]
  savedRoutines?: string[]
  likedRoutines?: string[]
  dislikedRoutines?: string[]
  adaptedRoutines?: string[]
  // Ingredients Cache
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
  uid?: string // Firebase requires this
  phoneNumber?: string | null // Firebase requires this
}

export interface HairAnalysis {
  // Core 5 - used for follicleId
  hairType: 'straight' | 'wavy' | 'curly' | 'coily' | 'protective'
  porosity: 'low' | 'medium' | 'high'
  density: 'low' | 'medium' | 'high'
  thickness: 'fine' | 'medium' | 'coarse'
  damage: 'none' | 'some' | 'severe'

  // Additional characteristics
  length?: 'short' | 'medium' | 'long'
  scalpType?: 'dry' | 'balanced' | 'oily'
  mainGoal?: 'moisture' | 'definition' | 'growth' | 'repair' | 'volume'
  budget?: number
  washFrequency?: 'daily' | 'every2-3' | 'weekly' | 'biweekly'

  // ML classification (keeping for later)
  mlClassification?: {
    confidence: number
    predictions: Record<string, number>
  }
}
