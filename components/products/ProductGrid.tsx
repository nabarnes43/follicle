'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ProductCard } from '@/components/products/ProductCard'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Package, Search, X } from 'lucide-react'
import type { PreComputedProductMatchScore } from '@/types/productMatching'
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton'
import { useRouter } from 'next/navigation'

const INITIAL_DISPLAY_LIMIT = 48
const LOAD_MORE_INCREMENT = 48

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
 * - Infinite scroll pagination
 * - Product detail dialog
 *
 * Why is search client-side?
 * - Products are already fetched and scored
 * - Client-side search is instant (no network round-trip)
 * - Only filters what's displayed, doesn't re-score
 */
export function ProductGrid({
  products,
  showMatchScores = true,
  emptyMessage = 'No products found',
  loading = false,
  hideSaveButton = false,
}: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT)
  const [selectedMatch, setSelectedMatch] =
    useState<PreComputedProductMatchScore | null>(null)

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Filter by search query (client-side)
  const { displayedProducts, totalCount } = useMemo(() => {
    let filtered = products

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.product.name.toLowerCase().includes(query) ||
          m.product.brand.toLowerCase().includes(query)
      )
    }

    return {
      displayedProducts: filtered.slice(0, displayLimit),
      totalCount: filtered.length,
    }
  }, [products, searchQuery, displayLimit])

  // Reset pagination when search changes
  useEffect(() => {
    setDisplayLimit(INITIAL_DISPLAY_LIMIT)
  }, [searchQuery])

  // Infinite scroll observer
  useEffect(() => {
    const currentRef = loadMoreRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayLimit < totalCount) {
          setDisplayLimit((prev) => prev + LOAD_MORE_INCREMENT)
        }
      },
      { rootMargin: '200px', threshold: 0 }
    )

    if (currentRef) observer.observe(currentRef)
    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [displayLimit, totalCount])

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search by product or brand name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Skeleton loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Product Count */}
      {totalCount > 0 && (
        <div className="mb-4">
          <p className="text-muted-foreground text-sm">
            Showing {displayedProducts.length} of {totalCount} products
          </p>
        </div>
      )}

      {/* Empty State: Only displays if NOT loading AND totalCount is 0 */}
      {!loading && totalCount === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>No Products Found</EmptyTitle>
            <EmptyDescription>{emptyMessage}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* Product Grid & Infinite Scroll: Only displays if NOT loading AND totalCount > 0 */}
      {!loading && totalCount > 0 && (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedProducts.map((match) => (
              <ProductCard
                key={match.product.id}
                product={match.product}
                matchScore={showMatchScores ? match.totalScore : undefined}
                onClick={() => router.push(`/products/${match.product.id}`)}
                hideSaveButton={hideSaveButton}
              />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          {displayLimit < totalCount && (
            <div ref={loadMoreRef} className="mt-8 flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
