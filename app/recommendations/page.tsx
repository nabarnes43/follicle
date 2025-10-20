'use client'

import { useState, useEffect, useMemo } from 'react'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { User } from '@/types/user'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductDetailDialog } from '@/components/products/ProductDetailDialog'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { productsCache } from '@/lib/matching/productsCache'
import { matchProductsForUser } from '@/lib/matching/productMatcher'
import { generateFollicleId } from '@/lib/analysis/follicleId'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Package } from 'lucide-react'
import type { Product } from '@/types/product'
import type { MatchScore } from '@/types/matching'

const INITIAL_DISPLAY_LIMIT = 24
const LOAD_MORE_INCREMENT = 24

const ALL_CATEGORIES = [
  'Shampoos',
  'Conditioners',
  'Hair Masks',
  'Styling Creams & Sprays',
  'Hair Oils',
  'Leave-in Conditioners',
  'Hair Serums',
  'Gel, Pomade & Wax',
  'Leave-in Treatments',
  'Scalp Treatments',
  'Styling Tools',
  'Hair Sprays',
  'Dry Shampoos',
  'Mousse & Foam',
  'Heat Protectants',
  'Scalp Scrubs',
  'Detanglers',
  'Other Hair Cleansers',
  'Hair Loss',
  'Other Haircare',
  'Other Styling',
]

function RecommendationsContent({ userData }: { userData: User }) {
  // Data
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [allScoredProducts, setAllScoredProducts] = useState<MatchScore[]>([])

  // UI State
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT)
  const [selectedMatch, setSelectedMatch] = useState<MatchScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isScoring, setIsScoring] = useState(false)
  const [hasScored, setHasScored] = useState(false)

  const hairAnalysis = userData.hairAnalysis!
  const follicleId = generateFollicleId(hairAnalysis)

  // Fetch products once
  useEffect(() => {
    fetchProducts()
  }, [])

  // Score all products ONCE when we have data
  useEffect(() => {
    if (allProducts.length > 0 && !hasScored) {
      scoreAllProducts()
    }
  }, [allProducts, hasScored])

  // Reset display limit when category changes
  useEffect(() => {
    setDisplayLimit(INITIAL_DISPLAY_LIMIT)
  }, [selectedCategory])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      // Get products from cache
      const products = await productsCache.getProducts()
      setAllProducts(products)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scoreAllProducts = async () => {
    // Check cache first using userId
    const cached = productsCache.getAllScoredProducts(userData.userId)
    if (cached) {
      console.log('✅ Using cached scores for recommendations')
      setAllScoredProducts(cached)
      setHasScored(true)
      return
    }

    // Cache miss - score products
    console.log('❌ No cached scores - scoring all products')
    setIsScoring(true)
    try {
      const scored = await matchProductsForUser(
        { hairAnalysis },
        allProducts,
        follicleId,
        { category: undefined, limit: 9999 }
      )

      // Cache for future use (keyed by userId)
      productsCache.setAllScoredProducts(userData.userId, scored)

      setAllScoredProducts(scored)
      setHasScored(true)
    } catch (error) {
      console.error('Failed to score products:', error)
    } finally {
      setIsScoring(false)
    }
  }

  // Combined filtering and pagination
  const displayedRecommendations = useMemo(() => {
    // Filter by category
    let filtered =
      selectedCategory === 'all'
        ? allScoredProducts
        : allScoredProducts.filter(
            (m) => m.product.category === selectedCategory
          )

    // Filter by budget
    if (hairAnalysis?.budget) {
      filtered = filtered.filter((m) => m.product.price <= hairAnalysis.budget!)
    }

    // Paginate
    return filtered.slice(0, displayLimit)
  }, [allScoredProducts, selectedCategory, hairAnalysis, displayLimit])

  // Get total count for UI
  const totalFilteredCount = useMemo(() => {
    let filtered =
      selectedCategory === 'all'
        ? allScoredProducts
        : allScoredProducts.filter(
            (m) => m.product.category === selectedCategory
          )

    if (hairAnalysis?.budget) {
      filtered = filtered.filter((m) => m.product.price <= hairAnalysis.budget!)
    }

    return filtered.length
  }, [allScoredProducts, selectedCategory, hairAnalysis])

  const loadMore = () => {
    setDisplayLimit((prev) => prev + LOAD_MORE_INCREMENT)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-12 w-12" />
          <p className="text-muted-foreground text-lg">
            Loading your personalized recommendations...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">
          Your Product Recommendations
        </h1>
        <p className="text-muted-foreground">
          Personalized with follicle matching algorithm
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          disabled={isScoring}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {ALL_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scoring Progress */}
      {isScoring && (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Spinner className="h-12 w-12" />
          <p className="text-muted-foreground text-sm">
            Analyzing {allProducts.length} products with follicle matching
            algorithm...
          </p>
        </div>
      )}

      {/* Product Count */}
      {!isScoring && totalFilteredCount > 0 && (
        <div className="mb-4">
          <p className="text-muted-foreground text-sm">
            Showing {displayedRecommendations.length} of {totalFilteredCount}{' '}
            products
            {hairAnalysis.budget && ` (under $${hairAnalysis.budget})`}
          </p>
        </div>
      )}

      {/* Empty State */}
      {totalFilteredCount === 0 && !isScoring ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>No Products Found</EmptyTitle>
            <EmptyDescription>
              No products found in this category
              {hairAnalysis.budget && ` under $${hairAnalysis.budget}`}.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedRecommendations.map((match) => (
              <ProductCard
                key={match.product.id}
                match={match}
                onClick={() => setSelectedMatch(match)}
              />
            ))}
          </div>

          {/* Load More Button */}
          {displayedRecommendations.length < totalFilteredCount &&
            !isScoring && (
              <div className="mt-8 text-center">
                <Button onClick={loadMore} size="lg">
                  Load More Products (
                  {totalFilteredCount - displayedRecommendations.length}{' '}
                  remaining)
                </Button>
              </div>
            )}
        </>
      )}

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        match={selectedMatch}
        isOpen={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  )
}

export default function RecommendationsPage() {
  return (
    <RequireAuth requireFollicleId>
      {(userData) => <RecommendationsContent userData={userData} />}
    </RequireAuth>
  )
}
