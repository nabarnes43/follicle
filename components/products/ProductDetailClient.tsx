'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProductInteraction } from '@/hooks/useProductInteraction'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, ThumbsDown, Bookmark } from 'lucide-react'
import { Product } from '@/types/product'
import { PreComputedProductMatchScore } from '@/types/productMatching'

interface ProductDetailClientProps {
  product: Product
  productScore: PreComputedProductMatchScore | null
}

export function ProductDetailClient({
  product,
  productScore,
}: ProductDetailClientProps) {
  const router = useRouter()
  const {
    interactions,
    toggleLike,
    toggleDislike,
    toggleSave,
    trackView,
    isLoading,
  } = useProductInteraction(product.id)

  const hasTrackedView = useRef(false)

  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true
      trackView()
    }
  }, [trackView])

  const scorePercent = productScore
    ? Math.round(productScore.totalScore * 100)
    : null

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Back Button */}
      <Button
        onClick={() => router.back()}
        variant="ghost"
        size="sm"
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Header */}
      <div className="mb-6">
        <p className="text-muted-foreground mb-1">{product.brand}</p>
        <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
        <div className="flex items-center gap-3">
          {scorePercent !== null && (
            <Badge className="px-3 py-1 text-lg">{scorePercent}% Match</Badge>
          )}
          <span className="text-xl font-bold">
            {product.price
              ? `$${product.price.toFixed(2)}`
              : 'Price not available'}
          </span>
        </div>
      </div>

      {/* Match Reasons */}
      {productScore && productScore.matchReasons.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {productScore.matchReasons.map((reason, idx) => (
            <div
              key={idx}
              className="bg-muted text-muted-foreground rounded-md px-3 py-1.5 text-sm"
            >
              {reason}
            </div>
          ))}
        </div>
      )}

      {/* Product Image */}
      <div className="mb-6 flex aspect-square max-w-md items-center justify-center overflow-hidden rounded-lg bg-white">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-contain p-8"
          />
        ) : (
          <span className="text-muted-foreground">No image available</span>
        )}
      </div>

      {/* Interaction Buttons */}
      <div className="mb-8 flex gap-2">
        <Button
          onClick={toggleLike}
          disabled={isLoading}
          variant={interactions.like ? 'default' : 'outline'}
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
        >
          <Bookmark
            className={`mr-2 h-4 w-4 ${interactions.save ? 'fill-current' : ''}`}
          />
          {interactions.save ? 'Saved' : 'Save'}
        </Button>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Description</h2>
          <p className="text-muted-foreground">{product.description}</p>
        </div>
      )}

      {/* Ingredients */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Ingredients</h2>
        <div className="bg-muted max-h-48 overflow-y-auto rounded-lg p-4">
          {product.ingredients_normalized &&
          product.ingredients_normalized.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              {product.ingredients_normalized.join(', ')}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              No ingredients listed
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
