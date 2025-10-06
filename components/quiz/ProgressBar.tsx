// components/quiz/ProgressBar.tsx
import { Progress } from '@/components/ui/progress'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function ProgressBar({
  currentStep,
  totalSteps,
  className = '',
}: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className={`w-full ${className}`}>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
