'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Frequency } from '@/types/routine'

interface FrequencySelectorProps {
  value: Frequency
  onChange: (frequency: Frequency) => void
  label?: string
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function FrequencySelector({
  value,
  onChange,
  label = 'Frequency',
}: FrequencySelectorProps) {
  const toggleDay = (day: string) => {
    const days = value.days_of_week || []
    onChange({
      ...value,
      days_of_week: days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day],
    })
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="1"
          defaultValue={value.interval}
          onChange={(e) =>
            onChange({ ...value, interval: parseInt(e.target.value) || 1 })
          }
          className="w-16 text-center"
        />
        <Select
          value={value.unit}
          onValueChange={(unit: any) => onChange({ ...value, unit })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day{value.interval > 1 && 's'}</SelectItem>
            <SelectItem value="week">
              Week{value.interval > 1 && 's'}
            </SelectItem>
            <SelectItem value="month">
              Month{value.interval > 1 && 's'}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Weekly: Day checkboxes */}
      {value.unit === 'week' && (
        <div className="flex gap-2">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-1">
              <Checkbox
                id={day}
                checked={value.days_of_week?.includes(day)}
                onCheckedChange={() => toggleDay(day)}
              />
              <Label htmlFor={day} className="cursor-pointer text-sm">
                {day}
              </Label>
            </div>
          ))}
        </div>
      )}

      {/* Monthly: Day of month */}
      {value.unit === 'month' && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">On the</span>
          <Select
            value={value.day_of_month?.toString() || '1'}
            onValueChange={(day) =>
              onChange({ ...value, day_of_month: parseInt(day) })
            }
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">day of month</span>
        </div>
      )}
    </div>
  )
}
