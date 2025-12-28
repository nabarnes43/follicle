'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'
import { useProductInteraction } from '@/hooks/useProductInteraction'
import { ProductCardData } from '@/types/productMatching'
import { MatchScoreBadge } from '@/components/shared/MatchScoreBadge'

interface ProductCardProps {
  product: ProductCardData
  matchScore?: number
  onClick?: () => void
  hideSaveButton?: boolean
}

export function ProductCard({
  product,
  matchScore: initialMatchScore,
  onClick,
  hideSaveButton,
}: ProductCardProps) {
  const { user } = useAuth()
  const [matchScore, setMatchScore] = useState(initialMatchScore)
  const { interactions, toggleSave, isLoading } = useProductInteraction(
    product.id
  )

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleSave()

    if (user) {
      try {
        const token = await user.getIdToken()
        const response = await fetch(`/api/products/${product.id}/score`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.score) {
            setMatchScore(data.score.totalScore)
            console.log('✅ Updated score in card:', data.score.totalScore)
          }
        }
      } catch (error) {
        console.error('Failed to fetch fresh score:', error)
      }
    }
  }

  return (
    <Card
      className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="flex flex-1 flex-col p-4">
        {/* Header with Save Button */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm">{product.brand}</p>
            <h3 className="line-clamp-2 min-h-[2.5rem] font-semibold">
              {product.name}
            </h3>
          </div>
          {!hideSaveButton && (
            <Button
              onClick={handleSaveClick}
              variant={interactions.save ? 'default' : 'outline'}
              size="sm"
              disabled={isLoading}
              className="flex-shrink-0"
            >
              <Bookmark
                className={`h-4 w-4 ${interactions.save ? 'fill-current' : ''}`}
              />
            </Button>
          )}
        </div>

        {/* Product Image */}
        {product.image_url ? (
          <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white">
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain p-4"
            />
          </div>
        ) : (
          <div className="mb-3 flex aspect-square items-center justify-center rounded-lg bg-gray-100">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price & Match Score */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-[4rem]">
            {product.price ? (
              <p className="font-bold">${product.price.toFixed(2)}</p>
            ) : (
              <p className="text-muted-foreground text-sm"></p>
            )}
          </div>

          {matchScore !== undefined && (
            <MatchScoreBadge
              score={matchScore}
              variant="compact"
              className="text-right"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
