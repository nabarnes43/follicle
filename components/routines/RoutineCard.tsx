'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bookmark, Lock, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PreComputedRoutineMatchScore } from '@/types/routineMatching'
import { useRoutineInteraction } from '@/hooks/useRoutineInteraction'

interface RoutineCardProps {
  routineScore: PreComputedRoutineMatchScore
  showMatchScore?: boolean
  onView?: () => void
  hideSaveButton?: boolean
}

export function RoutineCard({
  routineScore,
  showMatchScore = true,
  onView,
  hideSaveButton = false,
}: RoutineCardProps) {
  const { routine, totalScore } = routineScore
  const { interactions, toggleSave, isLoading } = useRoutineInteraction(
    routine.id
  )

  const steps = routine.steps || []

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleSave()
  }

  // Always show exactly 3 step slots
  const slots = [0, 1, 2]
  const remainingCount = Math.max(0, routine.stepCount - 3)

  return (
    <Card
      className="relative cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={onView}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {routine.isPublic ? (
              <Globe className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            ) : (
              <Lock className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            )}
            <h3 className="min-w-0 flex-1 truncate text-lg font-semibold capitalize">
              {routine.name}
            </h3>
          </div>
          {/* Match Score & Save Button */}
          <div className="flex flex-shrink-0 items-center gap-2">
            {showMatchScore && (
              <div className="text-center">
                <p className="text-primary text-md leading-none font-semibold">
                  {Math.round(totalScore * 100)}%
                </p>
                <p className="text-muted-foreground text-[9px] leading-tight">
                  Match
                </p>
              </div>
            )}
            {!hideSaveButton && (
              <Button
                onClick={handleSaveClick}
                variant={interactions.save ? 'default' : 'outline'}
                size="sm"
                disabled={isLoading}
                className="flex-shrink-0"
              >
                <Bookmark
                  className={`h-4 w-4 ${interactions.save ? 'fill-current' : ''}`}
                />
              </Button>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-3 flex h-6 items-center gap-2">
          <p className="text-muted-foreground text-sm">
            {routine.stepCount} step{routine.stepCount !== 1 ? 's' : ''} •{' '}
            {routine.frequency.unit === 'day'
              ? 'Daily'
              : routine.frequency.unit === 'week'
                ? 'Weekly'
                : 'Monthly'}
          </p>
          {remainingCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{remainingCount} more
            </Badge>
          )}
        </div>

        {/* Steps - Always show 3 slots for consistent card height */}
        <div className="mb-3">
          <p className="text-muted-foreground mb-2 text-xs font-medium">
            Steps:
          </p>
          <div className="space-y-2">
            {slots.map((index) => {
              const step = steps[index]
              // Empty slot
              if (!step) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="grid grid-cols-[24px_.5fr_8px_32px_1fr] items-center gap-3"
                  >
                    <div className="bg-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-muted-foreground/50 truncate text-sm italic">
                      Empty step
                    </span>
                    <span className="text-muted-foreground/30 text-center">
                      •
                    </span>
                    <div className="h-8 w-8 rounded border border-gray-200 bg-gray-50" />
                    <div className="bg-muted h-px" />
                  </div>
                )
              }

              return (
                <div
                  key={index}
                  className="grid grid-cols-[24px_.5fr_8px_32px_1fr] items-center gap-3"
                >
                  <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-muted-foreground min-w-0 truncate text-sm font-medium">
                    {step.stepName}
                  </span>
                  <span className="text-muted-foreground text-center">•</span>
                  {step.productImageUrl ? (
                    <img
                      src={step.productImageUrl}
                      alt={step.productName || ''}
                      className="h-8 w-8 rounded bg-white object-contain"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-gray-100" />
                  )}
                  <span className="min-w-0 truncate text-sm">
                    {step.productBrand && step.productName
                      ? `${step.productBrand} ${step.productName}`
                      : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
