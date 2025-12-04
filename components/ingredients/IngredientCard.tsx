'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Ingredient } from '@/types/ingredient'

interface IngredientCardProps {
  ingredient: Ingredient
  onClick?: () => void
}

export function IngredientCard({ ingredient, onClick }: IngredientCardProps) {
  return (
    <Card
      className="flex h-full cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="flex flex-1 flex-col p-4">
        {/* Header: INCI Name (1 line, truncated) */}
        <h3 className="mb-2 truncate leading-tight font-semibold">
          {ingredient.inciName}
        </h3>

        {/* CAS Number (1 line, truncated, with spacing) */}
        <p className="text-muted-foreground mb-3 truncate text-xs leading-tight">
          {ingredient.casNo?.trim() || 'N/A'}
        </p>

        {/* Function Type Badge - exactly 2 lines height */}
        <div className="mb-3">
          <Badge
            variant="secondary"
            className="flex h-12 w-full items-start overflow-hidden text-xs leading-5"
          >
            <span className="line-clamp-2">
              {ingredient.functionType || 'N/A'}
            </span>
          </Badge>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: Product Count */}
        <div>
          <p className="text-muted-foreground text-sm">
            {ingredient.product_count?.toLocaleString() ?? 0} products
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
