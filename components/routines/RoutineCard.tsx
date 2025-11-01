'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Routine } from '@/types/routine'
import { Product } from '@/types/product'
import { Eye, Share2, Trash2, Lock, Globe } from 'lucide-react'

interface RoutineCardProps {
  routine: Routine
  allProducts: Product[]
  onView: () => void
  onShare: () => void
  onDelete: () => void
}

export function RoutineCard({
  routine,
  allProducts,
  onView,
  onShare,
  onDelete,
}: RoutineCardProps) {
  const [showAll, setShowAll] = useState(false)
  const stepsToShow = showAll ? routine.steps : routine.steps.slice(0, 3)
  const hasMore = routine.steps.length > 3

  const formatDate = (ts: any) => {
    const date = ts?.toDate ? ts.toDate() : new Date(ts?.seconds * 1000)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {routine.is_public ? (
              <Globe className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            ) : (
              <Lock className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            )}
            <h3 className="truncate text-lg font-semibold">{routine.name}</h3>
          </div>
          <div className="flex flex-shrink-0 gap-1">
            <Button onClick={onView} variant="default" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            {routine.is_public && (
              <Button onClick={onShare} variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={onDelete}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <p className="text-muted-foreground mb-3 text-sm">
          {routine.steps.length} step{routine.steps.length !== 1 ? 's' : ''} •{' '}
          {routine.frequency.unit === 'day'
            ? 'Daily'
            : routine.frequency.unit === 'week'
              ? 'Weekly'
              : 'Monthly'}
        </p>

        {/* Steps */}
        <div className="mb-3">
          <p className="text-muted-foreground mb-2 text-xs font-medium">
            Steps:
          </p>
          <div className="space-y-2">
            {stepsToShow.map((step, i) => {
              const product = allProducts.find(
                (p) => p.id === step.products[0]?.product_id
              )
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {i + 1}
                  </div>
                  <span className="text-muted-foreground w-32 flex-shrink-0 text-sm font-medium">
                    {step.step_name}
                  </span>
                  <span className="text-muted-foreground flex-shrink-0">•</span>
                  {product?.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-8 w-8 flex-shrink-0 rounded bg-white object-contain"
                    />
                  ) : (
                    <div className="h-8 w-8 flex-shrink-0 rounded bg-gray-100" />
                  )}
                  {product && (
                    <span className="min-w-0 truncate text-sm">
                      {product.brand} {product.name}
                    </span>
                  )}
                </div>
              )
            })}
            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-primary ml-9 text-sm font-medium hover:underline"
              >
                {showAll
                  ? 'Show less'
                  : `View ${routine.steps.length - 3} more step${routine.steps.length - 3 !== 1 ? 's' : ''}`}
              </button>
            )}
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
