export interface Frequency {
  interval: number
  unit: 'day' | 'week' | 'month'
}

export interface RoutineStep {
  order: number
  step_name: string
  product_id: string
  frequency: Frequency
  technique?: string
  notes?: string
  amount?: string
}

export interface Routine {
  id: string
  user_id: string
  name: string
  description?: string
  steps: RoutineStep[]
  frequency: Frequency
  is_public: boolean
  adaptedFrom?: string
  created_at: any
  updated_at?: any
}
