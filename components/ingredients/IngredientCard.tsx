'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, Ban, AlertTriangle } from 'lucide-react'
import { Ingredient } from '@/types/ingredient'
import { useIngredientInteraction } from '@/hooks/useIngredientInteraction'

interface IngredientCardProps {
  ingredient: Ingredient
  onClick?: () => void
}

/**
 * IngredientCard - Displays a single ingredient
 *
 * Shows:
 * - INCI name (primary), common name (secondary)
 * - Function type badge
 * - Product count
 * - Interaction buttons (like, dislike, avoid, allergic)
 */
export function IngredientCard({ ingredient, onClick }: IngredientCardProps) {
  const {
    interactions,
    toggleLike,
    toggleDislike,
    toggleAvoid,
    toggleAllergic,
    isLoading,
  } = useIngredientInteraction(ingredient.id)

  const handleInteraction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  return (
    <Card
      className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="flex flex-1 flex-col p-4">
        {/* Header */}
        <div className="mb-2">
          <h3 className="line-clamp-1 font-semibold">{ingredient.inciName}</h3>
          {ingredient.innName && ingredient.innName !== ingredient.inciName && (
            <p className="text-muted-foreground line-clamp-1 text-sm">
              {ingredient.innName}
            </p>
          )}
        </div>

        {/* Function Type Badge */}
        {ingredient.functionType && (
          <div className="mb-3">
            <Badge variant="secondary" className="text-xs">
              {ingredient.functionType}
            </Badge>
          </div>
        )}

        {/* Restriction Warning */}
        {ingredient.restriction &&
          ingredient.restriction.toLowerCase() !== 'none' && (
            <p className="text-destructive mb-2 line-clamp-1 text-xs">
              ⚠️ {ingredient.restriction}
            </p>
          )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: Product Count & Interactions */}
        <div className="flex items-end justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {ingredient.product_count?.toLocaleString() ?? 0} products
          </p>

          {/* Interaction Buttons */}
          <div className="flex gap-1">
            <Button
              size="icon"
              variant={interactions.like ? 'default' : 'ghost'}
              className="h-8 w-8"
              disabled={isLoading}
              onClick={(e) => handleInteraction(e, toggleLike)}
              title="Like"
            >
              <ThumbsUp
                className={`h-4 w-4 ${interactions.like ? 'fill-current' : ''}`}
              />
            </Button>
            <Button
              size="icon"
              variant={interactions.dislike ? 'default' : 'ghost'}
              className="h-8 w-8"
              disabled={isLoading}
              onClick={(e) => handleInteraction(e, toggleDislike)}
              title="Dislike"
            >
              <ThumbsDown
                className={`h-4 w-4 ${interactions.dislike ? 'fill-current' : ''}`}
              />
            </Button>
            <Button
              size="icon"
              variant={interactions.avoid ? 'destructive' : 'ghost'}
              className="h-8 w-8"
              disabled={isLoading}
              onClick={(e) => handleInteraction(e, toggleAvoid)}
              title="Avoid"
            >
              <Ban className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={interactions.allergic ? 'destructive' : 'ghost'}
              className="h-8 w-8"
              disabled={isLoading}
              onClick={(e) => handleInteraction(e, toggleAllergic)}
              title="Allergic"
            >
              <AlertTriangle
                className={`h-4 w-4 ${interactions.allergic ? 'fill-current' : ''}`}
              />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
