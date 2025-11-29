'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Ban,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react'
import { Ingredient } from '@/types/ingredient'
import { ingredientsCache } from '@/lib/ingredients/ingredientsCache'
import { useIngredientInteraction } from '@/hooks/useIngredientInteraction'
import { productsCache } from '@/lib/matching/products/productsCache'
import { Product } from '@/types/product'

export default function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [ingredient, setIngredient] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const {
    interactions,
    toggleLike,
    toggleDislike,
    toggleAvoid,
    toggleAllergic,
    trackView,
    isLoading: interactionLoading,
  } = useIngredientInteraction(id)

  const hasTrackedView = useRef(false)

  // Fetch ingredient
  useEffect(() => {
    const fetchIngredient = async () => {
      setLoading(true)
      try {
        const ingredients = await ingredientsCache.getIngredients()
        const found = ingredients.find((i) => i.id === id)

        if (!found) {
          setError('Ingredient not found')
        } else {
          setIngredient(found)
        }
      } catch (err) {
        console.error('Error fetching ingredient:', err)
        setError('Failed to load ingredient')
      } finally {
        setLoading(false)
      }
    }

    fetchIngredient()
  }, [id])

  // Track view once
  useEffect(() => {
    if (ingredient && !hasTrackedView.current) {
      hasTrackedView.current = true
      trackView()
    }
  }, [ingredient?.id, trackView])

  // Fetch products containing this ingredient
  useEffect(() => {
    const fetchProducts = async () => {
      if (!ingredient) return

      setProductsLoading(true)
      try {
        const allProducts = await productsCache.getProducts()
        const matching = allProducts.filter((p) =>
          p.ingredient_refs?.includes(id)
        )
        setProducts(matching)
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [ingredient, id])
  
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !ingredient) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Ingredient Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'This ingredient does not exist.'}
          </p>
          <Button onClick={() => router.push('/ingredients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ingredients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button & Title */}
          <div className="mb-4 flex items-center gap-3">
            <Button onClick={() => router.back()} variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
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

          {/* Function Type & Product Count */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {ingredient.functionType && (
              <Badge variant="secondary">{ingredient.functionType}</Badge>
            )}
            <span className="text-muted-foreground text-sm">
              Found in {ingredient.product_count?.toLocaleString() ?? 0}{' '}
              products
            </span>
          </div>

          {/* Restriction Warning */}
          {ingredient.restriction &&
            ingredient.restriction.toLowerCase() !== 'none' && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">
                  ⚠️ Restriction: {ingredient.restriction}
                </p>
              </div>
            )}

          {/* Interaction Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={toggleLike}
              disabled={interactionLoading}
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
              disabled={interactionLoading}
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
              disabled={interactionLoading}
              variant={interactions.avoid ? 'destructive' : 'outline'}
              size="sm"
            >
              <Ban className="mr-2 h-4 w-4" />
              {interactions.avoid ? 'Avoiding' : 'Avoid'}
            </Button>

            <Button
              onClick={toggleAllergic}
              disabled={interactionLoading}
              variant={interactions.allergic ? 'destructive' : 'outline'}
              size="sm"
            >
              <AlertTriangle
                className={`mr-2 h-4 w-4 ${interactions.allergic ? 'fill-current' : ''}`}
              />
              {interactions.allergic ? 'Allergic' : 'Mark Allergic'}
            </Button>
          </div>
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

        {/* TODO: Products containing this ingredient */}
        {/* 
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Products with this ingredient
            </h2>
            <p className="text-muted-foreground text-sm">
              Coming soon - query products where ingredient_refs contains this ingredient
            </p>
          </CardContent>
        </Card>
        */}
      </div>
    </div>
  )
}
