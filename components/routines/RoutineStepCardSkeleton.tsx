import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function RoutineStepCardSkeleton() {
  return (
    <Card className="p-6">
      {/* Header: Step number and controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <Skeleton className="h-8 w-8" />
      </div>

      {/* Product */}
      <div className="mb-4">
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="h-12 w-full" />
      </div>

      {/* Amount */}
      <div className="mb-4">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Frequency */}
      <div className="mb-4">
        <Skeleton className="mb-2 h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Technique */}
      <div className="mb-4">
        <Skeleton className="mb-2 h-4 w-36" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Notes */}
      <div>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-16 w-full" />
      </div>
    </Card>
  )
}