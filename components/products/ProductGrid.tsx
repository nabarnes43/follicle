'use client'

import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton'
import { BaseGrid } from '@/components/shared/BaseGrid'
import { Package } from 'lucide-react'
import type { PreComputedProductMatchScore } from '@/types/productMatching'
import { useRouter } from 'next/navigation'
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  DEFAULT_FILTER_STATE,
  FilterSidecarState,
  ProductFilterSidecar,
} from './ProductsFilterSidecar'
import { useState } from 'react'

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

  return (
    <BaseGrid
      items={products}
      loading={loading}
      gridClassName="grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      searchPlaceholder="Search by product or brand name..."
      getSearchableText={(match) =>
        `${match.product.name} ${match.product.brand}`
      }
      sort={filters.sort}
      maxPrice={filters.maxPrice}
      category={filters.category}
      getPrice={(match) => match.product.price ?? null}
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
