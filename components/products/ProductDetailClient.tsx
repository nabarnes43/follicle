// components/products/ProductDetailClient.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { useProductInteraction } from '@/hooks/useProductInteraction'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Heart,
  ThumbsDown,
  Bookmark,
  FlaskConical,
  ChevronDown,
} from 'lucide-react'
import { Product } from '@/types/product'
import { Ingredient } from '@/types/ingredient'
import { PreComputedProductMatchScore } from '@/types/productMatching'
import { IngredientCard } from '@/components/ingredients/IngredientCard'
import { MatchScoreBadge } from '@/components/shared/MatchScoreBadge'
import { BackButton } from '../navigation/BackButton'

interface ProductDetailClientProps {
  product: Product
  productScore: PreComputedProductMatchScore | null
  ingredients: Ingredient[]
  hideSaveButton?: boolean
}

const INITIAL_INGREDIENT_COUNT = 6

export function ProductDetailClient({
  product,
  productScore: initialProductScore,
  ingredients,
  hideSaveButton = false,
}: ProductDetailClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [productScore, setProductScore] = useState(initialProductScore)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAllIngredients, setShowAllIngredients] = useState(false)

  const {
    interactions,
    toggleLike,
    toggleDislike,
    toggleSave,
    trackView,
    isLoading,
    isReady,
  } = useProductInteraction(product.id)

  const hasTrackedView = useRef(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Reset tracking when product changes
  useEffect(() => {
    hasTrackedView.current = false
  }, [product.id])

  // Track view once when user is ready
  useEffect(() => {
    if (isReady && !hasTrackedView.current) {
      hasTrackedView.current = true
      console.log('Tracking view for product:', product.id, 'isReady:', isReady)
      trackView()
    }
  }, [isReady, trackView, product.id])

  // Function to fetch fresh score
  const refetchScore = async () => {
    if (!user) return

    setIsRefreshing(true)

    try {
      const token = await user.getIdToken()
      const response = await fetch(`/api/products/${product.id}/score`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.score) {
          setProductScore(data.score)
          console.log('Fetched fresh score:', data.score.totalScore)
        }
      }
    } catch (error) {
      console.error('Failed to fetch fresh score:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLike = async () => {
    await toggleLike()
    await refetchScore()
  }

  const handleDislike = async () => {
    await toggleDislike()
    await refetchScore()
  }

  const handleSave = async () => {
    await toggleSave()
    await refetchScore()
  }

  const scorePercent = productScore?.totalScore
    ? Math.round(productScore.totalScore * 100)
    : null

  // Determine which ingredients to show
  const displayedIngredients = showAllIngredients
    ? ingredients
    : ingredients.slice(0, INITIAL_INGREDIENT_COUNT)
  const hasMoreIngredients = ingredients.length > INITIAL_INGREDIENT_COUNT

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-3">
          <BackButton className="mb-4" />
          <div className="flex items-center justify-between gap-4">
            <h1 className="mb-1 text-3xl font-bold text-gray-900">
              {product.name}
            </h1>
            {product.status === 'pending_review' && (
              <Badge
                variant="outline"
                className="mt-1 border-yellow-400 bg-center whitespace-nowrap text-yellow-600"
              >
                Pending Review
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mb-3 text-lg">{product.brand}</p>
        </div>

        {/* Score & Interaction Buttons - Same Row */}
        {(productScore?.totalScore !== undefined || !hideSaveButton) && (
          <div className="mb-4 flex items-center justify-between gap-4">
            {productScore?.totalScore !== undefined && (
              <MatchScoreBadge score={productScore.totalScore} />
            )}

            {!hideSaveButton && (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleLike}
                  disabled={isLoading || !isReady || isRefreshing}
                  variant={interactions.like ? 'default' : 'outline'}
                  size="sm"
                >
                  <Heart
                    className={`mr-2 h-4 w-4 ${interactions.like ? 'fill-current' : ''}`}
                  />
                  {interactions.like ? 'Liked' : 'Like'}
                </Button>

                <Button
                  onClick={handleDislike}
                  disabled={isLoading || !isReady || isRefreshing}
                  variant={interactions.dislike ? 'destructive' : 'outline'}
                  size="sm"
                >
                  <ThumbsDown
                    className={`mr-2 h-4 w-4 ${interactions.dislike ? 'fill-current' : ''}`}
                  />
                  {interactions.dislike ? 'Disliked' : 'Dislike'}
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={isLoading || !isReady || isRefreshing}
                  variant={interactions.save ? 'default' : 'outline'}
                  size="sm"
                >
                  <Bookmark
                    className={`mr-2 h-4 w-4 ${interactions.save ? 'fill-current' : ''}`}
                  />
                  {interactions.save ? 'Saved' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Product Image - Larger */}
        <div className="mb-3 flex h-[500px] w-full items-center justify-center overflow-hidden rounded-lg bg-white">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain p-12"
            />
          ) : (
            <span className="text-muted-foreground">No image available</span>
          )}
        </div>

        {/* Price + Attribution Row */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {product.price
              ? `$${product.price.toFixed(2)}`
              : 'Price not available'}
          </span>
          <p className="text-muted-foreground text-xs">
            Added by {product.addedByUserName || 'Follicle'}
            {product.created_at && (
              <span>
                {' '}
                •{' '}
                {new Date(product.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </p>
        </div>

        {/* Match Reasons - Pills with minimal layout */}
        {productScore?.matchReasons && productScore.matchReasons.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold">
              Why this matches your hair
            </h3>
            <div className="flex flex-wrap gap-2">
              {productScore.matchReasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="bg-primary/10 text-primary rounded-full px-3 py-1.5 text-xs"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">Description</h2>
            <p className="text-muted-foreground">{product.description}</p>
          </div>
        )}

        {/* Ingredients Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <FlaskConical className="text-muted-foreground h-5 w-5" />
              <h2 className="text-lg font-semibold">Ingredients</h2>
            </div>

            {/* Ingredient Cards Grid */}
            {displayedIngredients.length > 0 && (
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedIngredients.map((ingredient) => (
                  <IngredientCard
                    key={ingredient.id}
                    ingredient={ingredient}
                    onClick={() => router.push(`/ingredients/${ingredient.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Show More Button */}
            {hasMoreIngredients && !showAllIngredients && (
              <div className="mb-4 text-center">
                <Button
                  onClick={() => setShowAllIngredients(true)}
                  variant="outline"
                  size="lg"
                >
                  Show All {ingredients.length} Ingredients
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Unmapped Ingredients */}
            {product.unmapped_ingredients &&
              product.unmapped_ingredients.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    Additional ingredients (not yet in database):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.unmapped_ingredients.map((ing, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {ing}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Fallback if no ingredients at all */}
            {ingredients.length === 0 &&
              (!product.unmapped_ingredients ||
                product.unmapped_ingredients.length === 0) && (
                <p className="text-muted-foreground text-sm">
                  No ingredients listed
                </p>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
