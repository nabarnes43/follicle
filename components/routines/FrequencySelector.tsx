'use client'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Frequency } from '@/types/routine'

interface FrequencySelectorProps {
  value: Frequency
  onChange: (frequency: Frequency) => void
  label?: string
}

export function FrequencySelector({
  value,
  onChange,
  label = 'Frequency',
}: FrequencySelectorProps) {
  const options = [
    { unit: 'day' as const, label: 'Daily' },
    { unit: 'week' as const, label: 'Weekly' },
    { unit: 'month' as const, label: 'Monthly' },
  ]

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {options.map((option) => (
          <Button
            key={option.unit}
            type="button"
            variant={value.unit === option.unit ? 'default' : 'outline'}
            onClick={() => onChange({ interval: 1, unit: option.unit })}
            className="flex-1"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
