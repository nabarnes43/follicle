import { Timestamp } from 'firebase/firestore'
import { ProductCategory } from '@/lib/matching/products/config/categories'

// Main routine interface
export interface Routine {
  id: string
  user_id: string
  follicle_id: string
  name: string
  description?: string
  steps: RoutineStep[]
  frequency: Frequency // Overall routine frequency
  is_public: boolean
  created_at: Date
  updated_at: Date
  deleted_at?: Timestamp | null
}
//TODO Make sure type matches functionality after the changes I made.
// Frequency structure for routines and steps
export interface Frequency {
  interval: number // 1, 2, 3...
  unit: 'day' | 'week' | 'month'
  days_of_week?: string[] // For weekly: ['Mo', 'Tu']
  day_of_month?: number // For monthly: 1-31
}

// Individual step in a routine
export interface RoutineStep {
  order: number
  step_name: ProductCategory // Must be one of the valid product categories
  product_id: string // Single product ID instead of array
  amount?: string // Optional amount for this product
  frequency: Frequency
  notes?: string
  technique?: string
}
