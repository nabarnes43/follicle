'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/auth'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductDetailDialog } from '@/components/products/ProductDetailDialog'
import { productsCache } from '@/lib/matching/productsCache'
import { matchProductsForUser } from '@/lib/matching/productMatcher'
import { generateFollicleId } from '@/lib/quiz/follicleId'
import { Button } from '@/components/ui/button'
import { PRODUCT_CATEGORIES } from '@/lib/matching/config/categories'
import type { Product } from '@/types/product'
import type { HairAnalysis } from '@/types/user'
import type { MatchScore } from '@/types/matching'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

const INITIAL_DISPLAY_LIMIT = 24
const LOAD_MORE_INCREMENT = 24

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

    // Score products
    setIsScoring(true)
    try {
      const scored = await matchProductsForUser(
        { hairAnalysis },
        allProducts,
        follicleId,
        { category: undefined, limit: 9999 }
      )

      setAllScoredProducts(scored)
      setHasScored(true)
    } catch (error) {
      console.error('Failed to score products:', error)
    } finally {
      setIsScoring(false)
    }
  }

  // Filter by category (instant - client-side)
  const filteredRecommendations = useMemo(() => {
    if (selectedCategory === 'all') return allScoredProducts
    return allScoredProducts.filter(
      (m) => m.product.category === selectedCategory
    )
  }, [allScoredProducts, selectedCategory])

  // Filter by budget (instant - client-side)
  const budgetFilteredRecommendations = useMemo(() => {
    if (!hairAnalysis?.budget) return filteredRecommendations
    return filteredRecommendations.filter(
      (m) => m.product.price <= hairAnalysis.budget!
    )
  }, [filteredRecommendations, hairAnalysis])

  // Slice for pagination
  const displayedRecommendations = budgetFilteredRecommendations.slice(
    0,
    displayLimit
  )

  const loadMore = () => {
    setDisplayLimit((prev) => prev + LOAD_MORE_INCREMENT)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
            <p className="text-lg">
              Loading your personalized recommendations...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">Please Log In</h1>
          <p>You need to be logged in to see personalized recommendations.</p>
        </div>
      </div>
    )
  }

  // No hair analysis
  if (!hairAnalysis) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">
            Complete Your Hair Analysis
          </h1>
          <p className="mb-4">
            Take our 5-minute quiz to get personalized product recommendations.
          </p>
          <Button onClick={() => (window.location.href = '/quiz')}>
            Take Quiz
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Your Recommendations</h1>
        <p className="text-muted-foreground">
          Personalized with fuzzy follicle matching
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            disabled={isScoring}
          >
            All Products{' '}
            {allScoredProducts.length > 0 && `(${allScoredProducts.length})`}
          </Button>
          {PRODUCT_CATEGORIES.map((category) => {
            const count = allScoredProducts.filter(
              (m) => m.product.category === category
            ).length
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                disabled={isScoring || count === 0}
              >
                {category} {count > 0 && `(${count})`}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Scoring Progress */}
      {isScoring && (
        <div className="mb-4 py-8 text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground text-sm">
            Analyzing {allProducts.length} products with fuzzy follicle
            matching...
            <br />
            <span className="text-xs">
              This happens once and takes 30-60 seconds
            </span>
          </p>
        </div>
      )}

      {/* Product Count */}
      {!isScoring && budgetFilteredRecommendations.length > 0 && (
        <div className="mb-4">
          <p className="text-muted-foreground text-sm">
            Showing {displayedRecommendations.length} of{' '}
            {budgetFilteredRecommendations.length} products
            {hairAnalysis.budget && ` (under $${hairAnalysis.budget})`}
          </p>
        </div>
      )}

      {/* Empty State */}
      {budgetFilteredRecommendations.length === 0 && !isScoring ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-lg">
            No products found in this category
            {hairAnalysis.budget && ` under $${hairAnalysis.budget}`}.
          </p>
        </div>
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
          {displayedRecommendations.length <
            budgetFilteredRecommendations.length &&
            !isScoring && (
              <div className="mt-8 text-center">
                <Button onClick={loadMore} size="lg">
                  Load More Products (
                  {budgetFilteredRecommendations.length -
                    displayedRecommendations.length}{' '}
                  remaining)
                </Button>
              </div>
            )}
        </>
      )}

      {/* Product Detail Dialog - Where all interactions happen */}
      <ProductDetailDialog
        match={selectedMatch}
        isOpen={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  )
}
