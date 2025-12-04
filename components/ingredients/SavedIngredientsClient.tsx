'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ThumbsUp, ThumbsDown, Ban, AlertTriangle } from 'lucide-react'
import { Ingredient } from '@/types/ingredient'
import { IngredientsGrid } from '@/components/ingredients/IngredientsGrid'

interface SavedIngredientsClientProps {
  likedIngredients: Ingredient[]
  dislikedIngredients: Ingredient[]
  avoidIngredients: Ingredient[]
  allergicIngredients: Ingredient[]
  loading?: boolean
}

export function SavedIngredientsClient({
  likedIngredients,
  dislikedIngredients,
  avoidIngredients,
  allergicIngredients,
  loading = false,
}: SavedIngredientsClientProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="mb-8 text-3xl font-bold">Saved Ingredients</h1>

      {/* Tabs */}
      <Tabs defaultValue="liked" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="liked" disabled={loading}>
            <ThumbsUp className="mr-2 h-4 w-4" />
            Liked {!loading && `(${likedIngredients.length})`}
          </TabsTrigger>
          <TabsTrigger value="disliked" disabled={loading}>
            <ThumbsDown className="mr-2 h-4 w-4" />
            Disliked {!loading && `(${dislikedIngredients.length})`}
          </TabsTrigger>
          <TabsTrigger value="avoid" disabled={loading}>
            <Ban className="mr-2 h-4 w-4" />
            Avoid {!loading && `(${avoidIngredients.length})`}
          </TabsTrigger>
          <TabsTrigger value="allergic" disabled={loading}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Allergic {!loading && `(${allergicIngredients.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liked">
          <IngredientsGrid ingredients={likedIngredients} loading={loading} />
        </TabsContent>

        <TabsContent value="disliked">
          <IngredientsGrid
            ingredients={dislikedIngredients}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="avoid">
          <IngredientsGrid ingredients={avoidIngredients} loading={loading} />
        </TabsContent>

        <TabsContent value="allergic">
          <IngredientsGrid
            ingredients={allergicIngredients}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
