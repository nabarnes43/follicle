// components/analysis/AnalysisQuestion.tsx
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { AnalysisQuestion as AnalysisQuestionType } from '@/types/analysis'

interface AnalysisQuestionProps {
  question: AnalysisQuestionType
  value?: string | string[] | number
  onChange: (value: string | string[] | number) => void
}

export function AnalysisQuestion({
  question,
  value,
  onChange,
}: AnalysisQuestionProps) {
  switch (question.type) {
    case 'radio':
      return (
        <RadioQuestion
          question={question}
          value={value as string}
          onChange={onChange}
        />
      )
    case 'select':
      return (
        <SelectQuestion
          question={question}
          value={value as string}
          onChange={onChange}
        />
      )
    case 'slider':
      return (
        <SliderQuestion
          question={question}
          value={value as number}
          onChange={onChange}
        />
      )
    case 'multiselect':
      return (
        <MultiSelectQuestion
          question={question}
          value={value as string[]}
          onChange={onChange}
        />
      )
    default:
      return null
  }
}

// Radio Question Component
function RadioQuestion({
  question,
  value,
  onChange,
}: {
  question: AnalysisQuestionType
  value?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{question.question}</h3>
      <RadioGroup value={value} onValueChange={onChange}>
        {question.options?.map((option) => (
          <div key={option.value} className="flex items-start space-x-3">
            <RadioGroupItem value={option.value} id={option.value} />
            <Label
              htmlFor={option.value}
              className="flex-1 cursor-pointer font-normal"
            >
              <span className="block">{option.label}</span>
              {option.description && (
                <span className="text-muted-foreground mt-1 block text-sm">
                  {option.description}
                </span>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

// Select Question Component
function SelectQuestion({
  question,
  value,
  onChange,
}: {
  question: AnalysisQuestionType
  value?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{question.question}</h3>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an option..." />
        </SelectTrigger>
        <SelectContent>
          {question.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Slider Question Component
function SliderQuestion({
  question,
  value,
  onChange,
}: {
  question: AnalysisQuestionType
  value?: number
  onChange: (value: number) => void
}) {
  const currentValue = value ?? question.min ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-medium">{question.question}</h3>
        <span className="text-primary text-lg font-semibold">
          {question.unit}
          {currentValue}
        </span>
      </div>
      <Slider
        value={[currentValue]}
        onValueChange={(values) => onChange(values[0])}
        min={question.min ?? 0}
        max={question.max ?? 100}
        step={question.step ?? 1}
        className="w-full"
      />
      <div className="text-muted-foreground flex justify-between text-sm">
        <span>
          {question.unit}
          {question.min ?? 0}
        </span>
        <span>
          {question.unit}
          {question.max ?? 100}
        </span>
      </div>
    </div>
  )
}

//MultiSelectQuestion
function MultiSelectQuestion({
  question,
  value = [],
  onChange,
}: {
  question: AnalysisQuestionType
  value?: string[]
  onChange: (value: string[]) => void
}) {
  const handleToggle = (optionValue: string) => {
    // Check if this option is a "none" type option
    const isNoneOption = optionValue === 'none' || optionValue === 'not'
    const hasNoneOption = value.includes('none') || value.includes('not')

    let newValue: string[]

    if (isNoneOption) {
      // If selecting "none", clear all other selections
      newValue = value.includes(optionValue) ? [] : [optionValue]
    } else {
      // If selecting any other option, remove "none" first
      const filteredValue = value.filter((v) => v !== 'none' && v !== 'not')
      newValue = filteredValue.includes(optionValue)
        ? filteredValue.filter((v) => v !== optionValue)
        : [...filteredValue, optionValue]
    }

    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{question.question}</h3>
      <div className="space-y-3">
        {question.options?.map((option) => (
          <div key={option.value} className="flex items-start space-x-3">
            <Checkbox
              id={option.value}
              checked={value.includes(option.value)}
              onCheckedChange={() => handleToggle(option.value)}
            />
            <Label
              htmlFor={option.value}
              className="flex-1 cursor-pointer font-normal"
            >
              <span className="block">{option.label}</span>
              {option.description && (
                <span className="text-muted-foreground mt-1 block text-sm">
                  {option.description}
                </span>
              )}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
