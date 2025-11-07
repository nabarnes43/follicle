'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Routine } from '@/types/routine'
import { Product } from '@/types/product'
import { Share2, Trash2, Lock, Globe } from 'lucide-react'

interface RoutineCardProps {
  routine: Routine
  allProducts: Product[]
  onView: () => void
  onShare: () => void
  onDelete?: () => void
}

export function RoutineCard({
  routine,
  allProducts,
  onView,
  onShare,
  onDelete,
}: RoutineCardProps) {
  const formatDate = (ts: any) => {
    if (!ts?._seconds) return 'Unknown'
    const date = new Date(ts._seconds * 1000)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Always show exactly 3 step slots
  const slots = [0, 1, 2]
  const remainingCount = Math.max(0, routine.steps.length - 3)

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    onShare()
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    onDelete?.()
  }

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={onView}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {routine.is_public ? (
              <Globe className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            ) : (
              <Lock className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            )}
            {/* Routine name - truncate if too long */}
            <h3 className="min-w-0 flex-1 truncate text-lg font-semibold capitalize">
              {routine.name}
            </h3>
          </div>
          <div className="flex flex-shrink-0 gap-1">
            {routine.is_public && (
              <Button onClick={handleShareClick} variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={handleDeleteClick}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-3 flex h-6 items-center gap-2">
          <p className="text-muted-foreground text-sm">
            {routine.steps.length} step{routine.steps.length !== 1 ? 's' : ''} •{' '}
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
              const step = routine.steps[index]

              // Empty slot - shows placeholder with gray badge and line
              if (!step) {
                return (
                  <div
                    key={`empty-${index}`}
                    // Grid: [checkbox | product name | + | ingredient count badge | ingredient list]
                    // Columns: 24px (checkbox), .5fr (product), 8px (spacer), 32px (badge), 1fr (ingredients)
                    className="grid grid-cols-[24px_.5fr_8px_32px_1fr] items-center gap-3"
                  >
                    {/* Number badge */}
                    <div className="bg-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                      {index + 1}
                    </div>
                    {/* Empty step text */}
                    <span className="text-muted-foreground/50 truncate text-sm italic">
                      Empty step
                    </span>
                    {/* Separator dot */}
                    <span className="text-muted-foreground/30 text-center">
                      •
                    </span>
                    {/* Empty image placeholder */}
                    <div className="h-8 w-8 rounded border border-gray-200 bg-gray-50" />
                    {/* Gray line placeholder */}
                    <div className="bg-muted h-px" />
                  </div>
                )
              }

              // Real step - fetch product data and display
              const product = allProducts.find(
                (p) => p.id === step.products[0]?.product_id
              )

              return (
                <div
                  key={index}
                  // Grid: [checkbox | product name | + | ingredient count badge | ingredient list]
                  // Columns: 24px (checkbox), .5fr (product), 8px (spacer), 32px (badge), 1fr (ingredients)
                  className="grid grid-cols-[24px_.5fr_8px_32px_1fr] items-center gap-3"
                >
                  {/* Number badge */}
                  <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-muted-foreground min-w-0 truncate text-sm font-medium">
                    {step.step_name}
                  </span>
                  {/* Separator dot */}
                  <span className="text-muted-foreground text-center">•</span>
                  {/* Product image */}
                  {product?.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-8 w-8 rounded bg-white object-contain"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-gray-100" />
                  )}
                  <span className="min-w-0 truncate text-sm">
                    {product ? `${product.brand} ${product.name}` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        {/* Timestamps */}
        <p className="text-muted-foreground text-xs">
          Created {formatDate(routine.created_at)}
          {routine.updated_at && ` • Updated ${formatDate(routine.updated_at)}`}
        </p>
      </CardContent>
    </Card>
  )
}
