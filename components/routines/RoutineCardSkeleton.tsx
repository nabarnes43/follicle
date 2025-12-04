import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function RoutineCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-16" />
        </div>

        {/* Metadata */}
        <Skeleton className="mb-3 h-4 w-1/2" />

        {/* Match reasons */}
        <div className="mb-3 flex gap-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>

        {/* Description */}
        <Skeleton className="mb-3 h-10 w-full" />

        {/* Timestamp */}
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}
