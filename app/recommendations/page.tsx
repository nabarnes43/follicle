'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/auth'
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
import { generateFollicleId } from '@/lib/quiz/follicleId'
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
import type { HairAnalysis } from '@/types/user'
import type { MatchScore } from '@/types/matching'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

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

export default function RecommendationsPage() {
  const { user } = useAuth()

  // Data
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [hairAnalysis, setHairAnalysis] = useState<HairAnalysis | null>(null)
  const [follicleId, setFollicleId] = useState<string>('')
  const [allScoredProducts, setAllScoredProducts] = useState<MatchScore[]>([])

  // UI State
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT)
  const [selectedMatch, setSelectedMatch] = useState<MatchScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isScoring, setIsScoring] = useState(false)
  const [hasScored, setHasScored] = useState(false)

  // Fetch products and user data once
  useEffect(() => {
    fetchInitialData()
  }, [user])

  // Score all products ONCE when we have data
  useEffect(() => {
    if (hairAnalysis && allProducts.length > 0 && !hasScored && follicleId) {
      scoreAllProducts()
    }
  }, [hairAnalysis, allProducts, hasScored, follicleId])

  // Reset display limit when category changes
  useEffect(() => {
    setDisplayLimit(INITIAL_DISPLAY_LIMIT)
  }, [selectedCategory])

  const fetchInitialData = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Get products from cache
      const products = await productsCache.getProducts()
      setAllProducts(products)

      // Get user's hair analysis
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()

      if (userData?.hairAnalysis) {
        setHairAnalysis(userData.hairAnalysis)
        setFollicleId(generateFollicleId(userData.hairAnalysis))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scoreAllProducts = async () => {
    if (!hairAnalysis || !user || !follicleId) return

    // Check cache first using userId
    const cached = productsCache.getAllScoredProducts(user.uid)
    if (cached) {
      setAllScoredProducts(cached)
      setHasScored(true)
      return
    }

    // Cache miss - score products
    setIsScoring(true)
    try {
      const scored = await matchProductsForUser(
        { hairAnalysis },
        allProducts,
        follicleId,
        { category: undefined, limit: 9999 }
      )

      // Cache for future use (keyed by userId)
      productsCache.setAllScoredProducts(user.uid, scored)

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

  // Not logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>Please Log In</EmptyTitle>
            <EmptyDescription>
              You need to be logged in to see personalized recommendations.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  // No hair analysis
  if (!hairAnalysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>Complete Your Hair Analysis</EmptyTitle>
            <EmptyDescription>
              Take our 10-minute analysis to get personalized product
              recommendations.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => (window.location.href = '/quiz')}>
              Take Quiz
            </Button>
          </EmptyContent>
        </Empty>
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
