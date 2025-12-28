'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PreComputedProductMatchScore } from '@/types/productMatching'
import { ProductGrid } from '@/components/products/ProductGrid'
import { SavedPageLayout } from '@/components/shared/SavedPageLayout'
import { Heart, Bookmark, ThumbsDown } from 'lucide-react'

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
  const defaultTab = searchParams.get('tab') || 'saved'

  // Determine title and subtitle based on context
  const title = profileUserDisplayName
    ? `${profileUserDisplayName}'s Products`
    : 'Saved Products'

  const subtitle = profileUserDisplayName
    ? 'Product interactions and preferences'
    : 'Your saved and liked products'

  return (
    <SavedPageLayout
      title={title}
      subtitle={subtitle}
      defaultTab={defaultTab}
      showBackButton={!!profileUserDisplayName}
      tabs={[
        {
          value: 'saved',
          label: 'Saved',
          icon: <Bookmark className="h-4 w-4" />,
          count: savedScores.length,
          content: (
            <ProductGrid
              products={savedScores}
              emptyMessage="Save products to review later!"
              hideSaveButton
            />
          ),
        },
        {
          value: 'liked',
          label: 'Liked',
          icon: <Heart className="h-4 w-4" />,
          count: likedScores.length,
          content: (
            <ProductGrid
              products={likedScores}
              emptyMessage="Browse products and like ones that work for you!"
              hideSaveButton
            />
          ),
        },
        {
          value: 'disliked',
          label: 'Disliked',
          icon: <ThumbsDown className="h-4 w-4" />,
          count: dislikedScores.length,
          content: (
            <ProductGrid
              products={dislikedScores}
              emptyMessage="Mark products that don't work for you!"
              hideSaveButton
            />
          ),
        },
      ]}
    />
  )
}
