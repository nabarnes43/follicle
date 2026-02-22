'use client'

import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton'
import { BaseGrid } from '@/components/shared/BaseGrid'
import { Package } from 'lucide-react'
import type { PreComputedProductMatchScore } from '@/types/productMatching'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  DEFAULT_FILTER_STATE,
  FilterSidecarState,
  ProductFilterSidecar,
} from './ProductsFilterSidecar'
import { useMemo, useState } from 'react'

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
  emptyMessage = 'Try adjusting your search or filter criteria.',
  loading = false,
  hideSaveButton = false,
}: ProductGridProps) {
  const router = useRouter()
  const [filters, setFilters] =
    useState<FilterSidecarState>(DEFAULT_FILTER_STATE)

  const activeFilterCount = [
    filters.sort !== 'default',
    filters.maxPrice !== null,
    filters.category !== 'all',
  ].filter(Boolean).length

  const processedProducts = useMemo(() => {
    let result = [...products]

    // Max price — null price always passes, sorted last
    if (filters.maxPrice !== null) {
      result = result.filter(
        (m) => m.product.price == null || m.product.price <= filters.maxPrice!
      )
    }

    // Sort by price
    const shouldSort = filters.sort !== 'default' || filters.maxPrice !== null
    if (shouldSort) {
      result.sort((a, b) => {
        const pa = a.product.price ?? null
        const pb = b.product.price ?? null
        if (pa == null && pb == null) return 0
        if (pa == null) return 1 // null last
        if (pb == null) return -1
        if (filters.sort === 'price_asc') return pa - pb
        if (filters.sort === 'price_desc') return pb - pa
        return 0
      })
    }

    return result
  }, [products, filters.sort, filters.maxPrice])

  return (
    <BaseGrid
      items={processedProducts}
      loading={loading}
      gridClassName="grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      searchPlaceholder="Search by product or brand name..."
      getSearchableText={(match) =>
        `${match.product.name} ${match.product.brand}`
      }
      category={filters.category}
      getCategory={(match) => match.product.category}
      sidecar={
        <ProductFilterSidecar
          state={filters}
          onChange={setFilters}
          activeFilterCount={activeFilterCount}
        />
      }
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
      emptyAction={
        <Link
          href="/products/add"
          className="text-primary flex items-center gap-1 text-sm hover:underline"
        >
          <Plus className="h-4 w-4" />
          Can't find your product? Add it
        </Link>
      }
    />
  )
}
