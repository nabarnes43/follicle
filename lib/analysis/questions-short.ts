// lib/analysis/questions-short.ts
import { AnalysisQuestion } from '@/types/analysis'

export const SHORT_ANALYSIS_QUESTIONS: AnalysisQuestion[] = [
  // 1. Hair Type
  {
    id: 'hairType',
    type: 'radio',
    question: 'What is your hair type?',
    required: true,
    options: [
      { value: 'straight', label: 'Straight' },
      { value: 'wavy', label: 'Wavy' },
      { value: 'curly', label: 'Curly' },
      { value: 'coily', label: 'Coily' },
      { value: 'protective', label: 'Protective Style' },
    ],
  },

  // 2. Porosity
  {
    id: 'porosity',
    type: 'radio',
    question: 'How long does your hair take to air dry?',
    required: true,
    options: [
      { value: 'low', label: '4+ hours', description: 'Low porosity' },
      { value: 'medium', label: '2-3 hours', description: 'Medium porosity' },
      { value: 'high', label: '1-2 hours', description: 'High porosity' },
    ],
  },

  // 3. Density
  {
    id: 'density',
    type: 'radio',
    question: 'How much hair do you have?',
    required: true,
    options: [
      { value: 'low', label: 'Low - Can see scalp easily' },
      { value: 'medium', label: 'Medium - Some scalp visibility' },
      { value: 'high', label: 'High - Difficult to see scalp' },
    ],
  },

  // 4. Thickness
  {
    id: 'thickness',
    type: 'radio',
    question: 'How thick are individual hair strands?',
    required: true,
    options: [
      { value: 'fine', label: 'Fine - Thin, hard to feel' },
      { value: 'medium', label: 'Medium - Can feel strands' },
      { value: 'coarse', label: 'Coarse - Thick, easy to feel' },
    ],
  },

  // 5. Damage
  {
    id: 'damage',
    type: 'radio',
    question: 'What is your damage level?',
    required: true,
    options: [
      { value: 'none', label: 'Healthy - No damage' },
      { value: 'some', label: 'Some - Split ends or breakage' },
      { value: 'severe', label: 'Severe - Significant damage' },
    ],
  },

  // 6. Length
  {
    id: 'length',
    type: 'select',
    question: "What's your hair length?",
    options: [
      { value: 'short', label: 'Short (chin or above)' },
      { value: 'medium', label: 'Medium (shoulder length)' },
      { value: 'long', label: 'Long (past shoulders)' },
    ],
  },

  // 7. Scalp Type
  {
    id: 'scalpType',
    type: 'radio',
    question: 'What is your scalp type?',
    options: [
      { value: 'dry', label: 'Dry' },
      { value: 'balanced', label: 'Balanced' },
      { value: 'oily', label: 'Oily' },
    ],
  },

  // 8. Main Goal
  {
    id: 'mainGoal',
    type: 'radio',
    question: 'What is your main hair goal?',
    options: [
      { value: 'moisture', label: 'Moisture & hydration' },
      { value: 'definition', label: 'Curl definition' },
      { value: 'growth', label: 'Hair growth' },
      { value: 'repair', label: 'Damage repair' },
      { value: 'volume', label: 'Volume' },
    ],
  },

  // 9. Budget
  {
    id: 'budget',
    type: 'slider',
    question: 'Monthly hair care budget?',
    min: 0,
    max: 200,
    step: 10,
    unit: '$',
  },

  // 10. Wash Frequency
  {
    id: 'washFrequency',
    type: 'select',
    question: 'How often do you wash your hair?',
    options: [
      { value: 'daily', label: 'Daily' },
      { value: 'every2-3', label: 'Every 2-3 days' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'biweekly', label: 'Every 2 weeks' },
    ],
  },
]
