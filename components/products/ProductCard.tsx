'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MatchScore } from '@/types/matching'

interface ProductCardProps {
  match: MatchScore
  userHairType: string
}

/**
 * ProductCard - Displays a single product recommendation
 *
 * Shows:
 * - Product image, brand, name, and price
 * - Match score (how well it fits the user's hair)
 * - Match reasons (why this product was recommended)
 */
export function ProductCard({ match, userHairType }: ProductCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      {/* Product Image */}
      {match.product.image_url && (
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={match.product.image_url}
            alt={match.product.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <CardContent className="p-4">
        {/* Brand & Name */}
        <p className="text-muted-foreground text-sm">{match.product.brand}</p>
        <h3 className="mb-2 line-clamp-2 font-semibold">
          {match.product.name}
        </h3>

        {/* Price & Match Score */}
        <div className="mb-3 flex items-center justify-between">
          {match.product.price && (
            <p className="font-bold">${match.product.price}</p>
          )}
          <div className="text-right">
            <p className="text-primary text-2xl font-bold">
              {Math.round(match.totalScore * 100)}%
            </p>
            <p className="text-muted-foreground text-xs">Match</p>
          </div>
        </div>

        {/* Match Reasons - Why this product was recommended */}
        <div className="space-y-1">
          {match.matchReasons.map((reason, idx) => (
            <p key={idx} className="text-muted-foreground text-xs">
              {reason}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
