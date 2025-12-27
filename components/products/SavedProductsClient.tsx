'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PreComputedProductMatchScore } from '@/types/productMatching'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Bookmark, ThumbsDown, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'

interface SavedProductsClientProps {
  likedScores: PreComputedProductMatchScore[]
  savedScores: PreComputedProductMatchScore[]
  dislikedScores: PreComputedProductMatchScore[]
  profileUserDisplayName?: string
}

export function SavedProductsClient({
  likedScores,
  savedScores,
  dislikedScores,
  profileUserDisplayName,
}: SavedProductsClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const defaultTab = searchParams.get('tab') || 'saved'

  // Determine title based on context
  const title = profileUserDisplayName
    ? `${profileUserDisplayName}'s Products`
    : 'Saved Products'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button - only show when viewing another user's profile */}
      {profileUserDisplayName && (
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}

      <h1 className="mb-8 text-3xl font-bold">{title}</h1>

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
