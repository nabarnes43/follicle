'use client'

import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton'
import { BaseGrid } from '@/components/shared/BaseGrid'
import { Package } from 'lucide-react'
import type { PreComputedProductMatchScore } from '@/types/productMatching'
import { useRouter } from 'next/navigation'
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories'

interface ProductGridProps {
  /** Pre-scored products from firebase */
  products: PreComputedProductMatchScore[]
  /** Whether to show match scores on cards (default: true) */
  showMatchScores?: boolean
  /** Message shown when no products match filters */
  emptyMessage?: string
  /** Show skeleton loading state */
  loading?: boolean
  /** Hide save button on cards (for saved page) */
  hideSaveButton?: boolean
}

/**
 * ProductGrid - Client component for displaying scored products
 *
 * Receives pre-scored products from Server Component, then handles:
 * - Search filtering (client-side, instant)
 * - Category filtering (client-side)
 * - Infinite scroll pagination
 * - Product detail navigation
 */
export function ProductGrid({
  products,
  showMatchScores = true,
  emptyMessage = 'No products found',
  loading = false,
  hideSaveButton = false,
}: ProductGridProps) {
  const router = useRouter()

  return (
    <BaseGrid
      items={products}
      loading={loading}
      gridClassName="grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      searchPlaceholder="Search by product or brand name..."
      getSearchableText={(match) =>
        `${match.product.name} ${match.product.brand}`
      }
      filters={[
        {
          getFilterValue: (match) => match.product.category,
          options: [
            { value: 'all', label: 'All Categories' },
            ...PRODUCT_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
          ],
          allValue: 'all',
        },
      ]}
      emptyIcon={<Package />}
      emptyTitle="No Products Found"
      emptyDescription={emptyMessage}
      renderCard={(match) => (
        <ProductCard
          product={match.product}
          matchScore={showMatchScores ? match.totalScore : undefined}
          onClick={() => router.push(`/products/${match.product.id}`)}
          hideSaveButton={hideSaveButton}
        />
      )}
      renderSkeleton={() => <ProductCardSkeleton />}
      resultsCountLabel={(displayed, total) =>
        `Showing ${displayed} of ${total} products`
      }
    />
  )
}
