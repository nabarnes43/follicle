'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PreComputedProductMatchScore } from '@/types/productMatching'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Bookmark, ThumbsDown } from 'lucide-react'

interface SavedProductsClientProps {
  likedScores: PreComputedProductMatchScore[]
  savedScores: PreComputedProductMatchScore[]
  dislikedScores: PreComputedProductMatchScore[]
}

export function SavedProductsClient({
  likedScores,
  savedScores,
  dislikedScores,
}: SavedProductsClientProps) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'saved'

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Saved Products</h1>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved ({savedScores.length})
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Liked ({likedScores.length})
          </TabsTrigger>
          <TabsTrigger value="disliked" className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4" />
            Disliked ({dislikedScores.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved">
          <ProductGrid
            products={savedScores}
            emptyMessage="Save products to review later!"
            hideSaveButton
          />
        </TabsContent>

        <TabsContent value="liked">
          <ProductGrid
            products={likedScores}
            emptyMessage="Browse products and like ones that work for you!"
            hideSaveButton
          />
        </TabsContent>

        <TabsContent value="disliked">
          <ProductGrid
            products={dislikedScores}
            emptyMessage="Mark products that don't work for you!"
            hideSaveButton
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
