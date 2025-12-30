'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Ban,
  AlertTriangle,
  FlaskConical,
  Package,
  Info,
} from 'lucide-react'
import { Ingredient } from '@/types/ingredient'
import { useIngredientInteraction } from '@/hooks/useIngredientInteraction'
import { PreComputedProductMatchScore } from '@/types/productMatching'
import { ProductCard } from '@/components/products/ProductCard'
import { getRestrictionInfo } from '@/lib/constants/restrictions'
import { BackButton } from '../navigation/BackButton'

interface IngredientDetailClientProps {
  ingredient: Ingredient
  products: PreComputedProductMatchScore[]
  hideSaveButton?: boolean
}

export function IngredientDetailClient({
  ingredient,
  products,
  hideSaveButton = false,
}: IngredientDetailClientProps) {
  const router = useRouter()
  const {
    interactions,
    toggleLike,
    toggleDislike,
    toggleAvoid,
    toggleAllergic,
    trackView,
    isLoading: interactionLoading,
    isReady,
  } = useIngredientInteraction(ingredient.id)

  const hasTrackedView = useRef(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Reset tracking when ingredient changes
  useEffect(() => {
    hasTrackedView.current = false
  }, [ingredient.id])

  // Track view once when user is ready
  useEffect(() => {
    if (isReady && !hasTrackedView.current) {
      hasTrackedView.current = true
      console.log(
        'Tracking view for ingredient:',
        ingredient.id,
        'isReady:',
        isReady
      )
      trackView()
    }
  }, [isReady, trackView, ingredient.id])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          {/* Back Button & Title */}
          <div className="pb-4">
            <BackButton />
          </div>

          {/* Ingredient Name */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {ingredient.inciName}
            </h1>
            {ingredient.innName &&
              ingredient.innName !== ingredient.inciName && (
                <p className="text-muted-foreground text-lg">
                  {ingredient.innName}
                </p>
              )}
          </div>
          {/* Function Types - as metadata */}
          {ingredient.functionType && (
            <p className="text-foreground mb-4 text-xs tracking-wide uppercase">
              {ingredient.functionType}
            </p>
          )}

          {/* Restriction Info - Badge inline with description */}
          {(() => {
            const restrictionInfo = getRestrictionInfo(ingredient.restriction)
            if (!restrictionInfo) return null

            return (
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-gray-300 bg-gray-100 text-gray-700"
                  >
                    <Info className="mr-1.5 h-3 w-3" />
                    {restrictionInfo.displayText}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {restrictionInfo.description}
                  </span>
                </div>
              </div>
            )
          })()}

          {/* Interaction Buttons - Only show if user has completed analysis */}
          {!hideSaveButton && (
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                onClick={toggleLike}
                disabled={interactionLoading || !isReady}
                variant={interactions.like ? 'default' : 'outline'}
                size="sm"
              >
                <ThumbsUp
                  className={`mr-2 h-4 w-4 ${interactions.like ? 'fill-current' : ''}`}
                />
                {interactions.like ? 'Liked' : 'Like'}
              </Button>

              <Button
                onClick={toggleDislike}
                disabled={interactionLoading || !isReady}
                variant={interactions.dislike ? 'destructive' : 'outline'}
                size="sm"
              >
                <ThumbsDown
                  className={`mr-2 h-4 w-4 ${interactions.dislike ? 'fill-current' : ''}`}
                />
                {interactions.dislike ? 'Disliked' : 'Dislike'}
              </Button>

              <Button
                onClick={toggleAvoid}
                disabled={interactionLoading || !isReady}
                variant={interactions.avoid ? 'destructive' : 'outline'}
                size="sm"
              >
                <Ban className="mr-2 h-4 w-4" />
                {interactions.avoid ? 'Avoiding' : 'Avoid'}
              </Button>

              <Button
                onClick={toggleAllergic}
                disabled={interactionLoading || !isReady}
                variant={interactions.allergic ? 'destructive' : 'outline'}
                size="sm"
              >
                <AlertTriangle
                  className={`mr-2 h-4 w-4 ${interactions.allergic ? 'fill-current' : ''}`}
                />
                {interactions.allergic ? 'Allergic' : 'Mark Allergic'}
              </Button>
            </div>
          )}
        </div>

        {/* Ingredient Details Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <FlaskConical className="text-muted-foreground h-5 w-5" />
              <h2 className="text-lg font-semibold">Ingredient Details</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ingredient.casNo && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium">
                    CAS Number
                  </p>
                  <p className="text-sm">{ingredient.casNo}</p>
                </div>
              )}

              {ingredient.ecNo && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium">
                    EC Number
                  </p>
                  <p className="text-sm">{ingredient.ecNo}</p>
                </div>
              )}

              {ingredient.cosingRefNo && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium">
                    COSING Ref
                  </p>
                  <p className="text-sm">{ingredient.cosingRefNo}</p>
                </div>
              )}

              {ingredient.phEurName && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium">
                    Ph. Eur. Name
                  </p>
                  <p className="text-sm">{ingredient.phEurName}</p>
                </div>
              )}
            </div>

            {/* Chemical Description */}
            {ingredient.chemIupacDescription && (
              <div className="mt-4 border-t pt-4">
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Chemical Description (IUPAC)
                </p>
                <p className="text-sm">{ingredient.chemIupacDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products containing this ingredient */}
        {products.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="text-muted-foreground h-5 w-5" />
                  <h2 className="text-lg font-semibold">
                    Products with this ingredient
                  </h2>
                </div>
                <span className="text-muted-foreground text-sm">
                  Showing {products.length} of{' '}
                  {ingredient.product_count?.toLocaleString() ?? 0}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((score) => (
                  <ProductCard
                    key={score.product.id}
                    product={score.product}
                    matchScore={score.totalScore}
                    hideSaveButton={hideSaveButton}
                  />
                ))}
              </div>

              {/* View All Button */}
              {ingredient.product_count > products.length && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={() =>
                      router.push(`/products/ingredient/${ingredient.id}`)
                    }
                    variant="outline"
                    size="lg"
                  >
                    View All {ingredient.product_count?.toLocaleString()}{' '}
                    Products →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Show message if no products at all */}
        {products.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No products found containing this ingredient
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
