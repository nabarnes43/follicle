import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton loader matching ProductCard dimensions
 * Used in loading states to show expected layout
 */
export function ProductCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardContent className="flex flex-1 animate-pulse flex-col p-4">
        {/* Brand + Name + Save button */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="mb-1 h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <Skeleton className="h-9 w-9 flex-shrink-0 rounded-md" />
        </div>

        {/* Product image */}
        <Skeleton className="mb-3 aspect-square w-full rounded-lg" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + Match score */}
        <div className="flex items-end justify-between gap-4">
          <Skeleton className="h-6 w-16" />
          <div className="text-right">
            <Skeleton className="mb-1 h-8 w-14" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
