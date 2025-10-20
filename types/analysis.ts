export type QuestionType = 'radio' | 'select' | 'slider' | 'multiselect'

export interface AnalysisOption {
  value: string
  label: string
  description?: string
}

export interface AnalysisQuestion {
  id: string
  type: QuestionType
  question: string
  options?: AnalysisOption[]
  min?: number
  max?: number
  step?: number
  unit?: string
  required?: boolean
}
