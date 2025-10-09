'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/auth'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PRODUCT_CATEGORIES } from '@/lib/matching/categories'
import { ProductCard } from '@/components/products/ProductCard'
import { Product } from '@/types/product'
import { matchProductsForUser } from '@/lib/matching/productMatcher'
import { HairAnalysis } from '@/types/user'
import { getUser } from '@/lib/firebase/quiz'
import { productsCache } from '@/lib/matching/productsCache'

// Configuration
const INITIAL_DISPLAY_LIMIT = 24
const LOAD_MORE_INCREMENT = 24

// In-memory cache (survives for the session)
let cachedProducts: Product[] | null = null

export default function RecommendationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [hairAnalysis, setHairAnalysis] = useState<HairAnalysis | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch products and user data ONCE
  useEffect(() => {
    if (!authLoading && (!user || user.isAnonymous)) {
      router.push('/quiz')
      return
    }

    if (user && !user.isAnonymous) {
      fetchInitialData()
    }
  }, [user, authLoading])

  // Reset display limit when category changes
  useEffect(() => {
    setDisplayLimit(INITIAL_DISPLAY_LIMIT)
  }, [selectedCategory])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch products using singleton cache
      const products = await productsCache.getProducts()

      // Fetch user data (always fresh)
      const userData = await getUser(user!.uid)

      if (!userData?.hairAnalysis) {
        throw new Error('Please complete the hair quiz first')
      }

      setAllProducts(products)
      setHairAnalysis(userData.hairAnalysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }
  // Score and filter products client-side (memoized)
  const recommendations = useMemo(() => {
    if (!hairAnalysis || allProducts.length === 0) return []

    const category = selectedCategory === 'all' ? undefined : selectedCategory

    return matchProductsForUser({ hairAnalysis }, allProducts, {
      category,
      limit: displayLimit,
    })
  }, [hairAnalysis, allProducts, selectedCategory, displayLimit])

  const loadMore = () => {
    setDisplayLimit((prev) => prev + LOAD_MORE_INCREMENT)
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          {/* Simple loading spinner */}
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-lg font-medium">Loading products...</p>
          <p className="text-muted-foreground mt-2 text-sm">
            This may take a few seconds on first load
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/quiz')}>Take Hair Quiz</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Your Recommendations</h1>
          {hairAnalysis && (
            <p className="text-muted-foreground mt-2">
              Personalized for {hairAnalysis.hairType} hair
            </p>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="mb-8">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full max-w-xs">
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

        {/* Products Grid */}
        {recommendations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No products found in this category.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recommendations.map((match) => (
                <ProductCard
                  key={match.product.id}
                  match={match}
                  userHairType={hairAnalysis?.hairType || ''}
                />
              ))}
            </div>

            {/* Load More Button - only show if there are more products */}
            {displayLimit < allProducts.length && (
              <div className="mt-8 text-center">
                <Button onClick={loadMore} size="lg">
                  Load More Products
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
