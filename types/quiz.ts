export type QuestionType = 'radio' | 'select' | 'slider' | 'multiselect'

export interface QuestionOption {
  value: string
  label: string
  description?: string
}

export interface QuizQuestion {
  id: string
  type: QuestionType
  question: string
  options?: QuestionOption[]
  min?: number
  max?: number
  step?: number
  unit?: string
  required?: boolean
}
