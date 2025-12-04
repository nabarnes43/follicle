import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function IngredientCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Function type badge */}
        <Skeleton className="mb-3 h-5 w-24" />

        {/* Ingredient name */}
        <Skeleton className="mb-2 h-6 w-full" />

        {/* Common name */}
        <Skeleton className="mb-3 h-4 w-3/4" />

        {/* Product count */}
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  )
}
