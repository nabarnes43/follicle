'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MatchScore } from '@/types/matching'

interface ProductCardProps {
  match: MatchScore
  onClick?: () => void
}

/**
 * ProductCard - Displays a single product recommendation
 *
 * Shows:
 * - Product image, brand, name, and price
 * - Match score (how well it fits the user's hair)
 * - Match reasons (why this product was recommended)
 *
 * Click to view details (interactions happen on detail page)
 */
export function ProductCard({ match, onClick }: ProductCardProps) {
  const { product } = match

  return (
    <Card
      className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      {/* Product Image */}
      {product.image_url ? (
        <div className="flex aspect-square items-center justify-center overflow-hidden bg-white">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-contain p-4"
          />
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center bg-gray-100">
          <span className="text-muted-foreground text-sm">No image</span>
        </div>
      )}

      <CardContent className="flex flex-1 flex-col p-4">
        {/* Brand */}
        <p className="text-muted-foreground text-sm">{product.brand}</p>

        {/* Product Name - Fixed height to prevent layout shift */}
        <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] font-semibold">
          {product.name}
        </h3>

        {/* Spacer to push price/match to bottom */}
        <div className="flex-1" />

        {/* Price & Match Score - Always in same position */}
        <div className="flex items-end justify-between gap-4">
          {/* Price - Fixed width to prevent match score from shifting */}
          <div className="min-w-[4rem]">
            {product.price ? (
              <p className="font-bold">${product.price.toFixed(2)}</p>
            ) : (
              <p className="text-muted-foreground text-sm">Price N/A</p>
            )}
          </div>

          {/* Match Score - Always right-aligned */}
          <div className="text-right">
            <p className="text-primary text-2xl font-bold">
              {Math.round(match.totalScore * 100)}%
            </p>
            <p className="text-muted-foreground text-xs">Match</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
