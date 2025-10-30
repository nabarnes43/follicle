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
}

// Frequency structure for routines and steps
export interface Frequency {
  interval: number // 1, 2, 3...
  unit: 'day' | 'week' | 'month'
  days_of_week?: string[] // For weekly: ['Mo', 'Tu']
  day_of_month?: number // For monthly: 1-31
}
// Product within a routine step (with amount)
export interface StepProduct {
  product_id: string
  amount?: string // Free text: "Dime-sized", "2 pumps", etc.
}

// Individual step in a routine
export interface RoutineStep {
  order: number
  step_name: string // Free text or from suggested categories
  products: StepProduct[] // Multiple products per step
  frequency: Frequency
  notes?: string
  technique?: string
}

// Suggested step categories for the dropdown
export const SUGGESTED_STEP_NAMES = [
  'Shampoo',
  'Condition',
  'Deep Condition',
  'Detangle',
  'Scalp Treatment',
  'Hair Mask',
  'Diffuse',
  'Air Dry',
  'Plop',
  'Refresh',
  'Other',
] as const
