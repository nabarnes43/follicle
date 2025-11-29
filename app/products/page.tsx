'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
import { productsCache } from '@/lib/matching/products/productsCache'
import { matchProductsForUser } from '@/lib/matching/products/productMatcher'
import { generateFollicleId } from '@/lib/analysis/follicleId'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Package, Search, X } from 'lucide-react'
import type { Product } from '@/types/product'
import type { ProductMatchScore } from '@/types/productMatching'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PRODUCT_CATEGORIES } from '@/lib/matching/products/config/categories'

const INITIAL_DISPLAY_LIMIT = 48
const LOAD_MORE_INCREMENT = 48

function RecommendationsContent({ userData }: { userData: User }) {
  // Data state
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [allScoredProducts, setAllScoredProducts] = useState<
    ProductMatchScore[]
  >([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT)
  const [selectedMatch, setSelectedMatch] = useState<ProductMatchScore | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isScoring, setIsScoring] = useState(false)
  const [hasScored, setHasScored] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Infinite scroll trigger
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const hairAnalysis = userData.hairAnalysis!
  const follicleId = generateFollicleId(hairAnalysis)

  // Fetch products once on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const products = await productsCache.getProducts()
        setAllProducts(products)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Score all products once when loaded
  useEffect(() => {
    if (allProducts.length === 0 || hasScored) return

    const scoreAllProducts = async () => {
      // Try cache first
      const cached = productsCache.getAllScoredProducts(userData.userId)
      if (cached) {
        console.log('✅ Using cached scores')
        setAllScoredProducts(cached)
        setHasScored(true)
        return
      }

      // Score products
      console.log('❌ Scoring all products')
      setIsScoring(true)
      try {
        const scored = await matchProductsForUser(
          { hairAnalysis },
          allProducts,
          follicleId,
          { category: undefined, limit: 9999 }
        )
        productsCache.setAllScoredProducts(userData.userId, scored)
        setAllScoredProducts(scored)
        setHasScored(true)
      } catch (error) {
        console.error('Failed to score products:', error)
      } finally {
        setIsScoring(false)
      }
    }
    scoreAllProducts()
  }, [allProducts, hasScored, userData.userId, hairAnalysis, follicleId])

  // Reset pagination when category changes
  useEffect(() => {
    setDisplayLimit(INITIAL_DISPLAY_LIMIT)
  }, [selectedCategory])

  // Filter Search and paginate products
  const { displayedProducts, totalCount } = useMemo(() => {
    let filtered = allScoredProducts

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.product.name.toLowerCase().includes(query) ||
          m.product.brand.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((m) => m.product.category === selectedCategory)
    }

    // Filter by budget
    if (hairAnalysis?.budget) {
      filtered = filtered.filter((m) => m.product.price <= hairAnalysis.budget!)
    }

    return {
      displayedProducts: filtered.slice(0, displayLimit),
      totalCount: filtered.length,
    }
  }, [
    allScoredProducts,
    searchQuery,
    selectedCategory,
    hairAnalysis,
    displayLimit,
  ])

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
      <div className="mb-8 flex gap-4">
        {/* Search Bar */}
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search by product or brand name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            disabled={isScoring}
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

        {/* Category Filter */}
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
            {PRODUCT_CATEGORIES.map((category) => (
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
      {!isScoring && totalCount > 0 && (
        <div className="mb-4">
          <p className="text-muted-foreground text-sm">
            Showing {displayedProducts.length} of {totalCount} products
            {hairAnalysis.budget && ` (under $${hairAnalysis.budget})`}
          </p>
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 && !isScoring ? (
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
            {displayedProducts.map((match) => (
              <ProductCard
                key={match.product.id}
                product={match.product}
                matchScore={match.totalScore}
                onClick={() => setSelectedMatch(match)}
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
