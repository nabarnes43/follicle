'use client'

import { useEffect, useRef } from 'react'
import { useProductInteraction } from '@/hooks/useProductInteraction'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ThumbsDown, Bookmark } from 'lucide-react'
import type { ProductMatchScore } from '@/types/productMatching'

interface ProductDetailDialogProps {
  match: ProductMatchScore | null
  isOpen: boolean
  onClose: () => void
  showMatchScore?: boolean // Control match score visibility
}

export function ProductDetailDialog({
  match,
  isOpen,
  onClose,
  showMatchScore = true, // Default to true for backward compatibility
}: ProductDetailDialogProps) {
  const {
    interactions,
    toggleLike,
    toggleDislike,
    toggleSave,
    trackView,
    isLoading,
  } = useProductInteraction(match?.product.id || '')

  const hasTrackedView = useRef(false)

  // Auto-track view when dialog opens (only once)
  useEffect(() => {
    if (isOpen && match && !hasTrackedView.current) {
      hasTrackedView.current = true
      trackView()
    }

    // Reset when dialog closes
    if (!isOpen) {
      hasTrackedView.current = false
    }
  }, [isOpen, match?.product.id])

  if (!match) return null

  const { product, totalScore, matchReasons } = match
  const scorePercent = Math.round(totalScore * 100)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.brand}</DialogDescription>
        </DialogHeader>

        {/* Product Image */}
        {product.image_url ? (
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white">
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain p-8"
            />
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}

        {/* Price & Match Score */}
        <div className="flex items-center gap-3">
          {/* Only show match score if enabled */}
          {showMatchScore && matchReasons.length > 0 && (
            <Badge className="px-3 py-1 text-lg">{scorePercent}% Match</Badge>
          )}
          <span className="text-xl font-bold">
            {product.price
              ? `$${product.price.toFixed(2)}`
              : 'Price not available'}
          </span>
        </div>

        {/* Match Reasons - Only show if showMatchScore is true */}
        {showMatchScore && matchReasons.length > 0 && (
          <div className="space-y-1">
            {matchReasons.map((reason, idx) => (
              <p key={idx} className="text-muted-foreground text-sm">
                • {reason}
              </p>
            ))}
          </div>
        )}

        {/* Interaction Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={toggleLike}
            disabled={isLoading}
            variant={interactions.like ? 'default' : 'outline'}
            className="flex-1"
          >
            <Heart
              className={`mr-2 h-4 w-4 ${interactions.like ? 'fill-current' : ''}`}
            />
            {interactions.like ? 'Liked' : 'Like'}
          </Button>

          <Button
            onClick={toggleDislike}
            disabled={isLoading}
            variant={interactions.dislike ? 'destructive' : 'outline'}
            className="flex-1"
          >
            <ThumbsDown
              className={`mr-2 h-4 w-4 ${interactions.dislike ? 'fill-current' : ''}`}
            />
            {interactions.dislike ? 'Disliked' : 'Dislike'}
          </Button>

          <Button
            onClick={toggleSave}
            disabled={isLoading}
            variant={interactions.save ? 'default' : 'outline'}
            className="flex-1"
          >
            <Bookmark
              className={`mr-2 h-4 w-4 ${interactions.save ? 'fill-current' : ''}`}
            />
            {interactions.save ? 'Saved' : 'Save'}
          </Button>
        </div>

        {/* Ingredients */}
        <div>
          <h3 className="mb-2 font-semibold">Ingredients</h3>
          <div className="bg-muted max-h-48 overflow-y-auto rounded-lg p-3">
            {product.ingredients_normalized &&
            product.ingredients_normalized.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                {product.ingredients_normalized.join(', ')}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                No ingredients listed
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
