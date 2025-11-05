'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'
import { MatchScore } from '@/types/matching'
import { useProductInteraction } from '@/hooks/useProductInteraction'

interface ProductCardProps {
  match: MatchScore
  onClick?: () => void
  showMatchScore?: boolean
}

/**
 * ProductCard - Displays a single product recommendation
 *
 * Shows:
 * - Product image, brand, name, and price
 * - Match score (how well it fits the user's hair) - optional via showMatchScore prop
 * - Match reasons (why this product was recommended)
 * - Save button (bookmark icon)
 *
 * Click card to view details
 * Click bookmark to save/unsave (doesn't open dialog)
 */
export function ProductCard({
  match,
  onClick,
  showMatchScore = true, // Default to true for backward compatibility
}: ProductCardProps) {
  const { product } = match
  const { interactions, toggleSave, isLoading } = useProductInteraction(
    product.id
  )

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    toggleSave()
  }

  return (
    <Card
      className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      {/* Product Image with Save Button Overlay */}
      <div className="relative">
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

        {/* Floating Save Button */}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 h-9 w-9 rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
          onClick={handleSaveClick}
          disabled={isLoading}
        >
          <Bookmark
            className={`h-4 w-4 ${
              interactions.save ? 'text-primary fill-current' : 'text-gray-600'
            }`}
          />
        </Button>
      </div>

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

          {/* Match Score - Conditionally rendered */}
          {showMatchScore && (
            <div className="text-right">
              <p className="text-primary text-2xl font-bold">
                {Math.round(match.totalScore * 100)}%
              </p>
              <p className="text-muted-foreground text-xs">Match</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
