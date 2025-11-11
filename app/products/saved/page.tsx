'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { User } from '@/types/user'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { Product } from '@/types/product'
import { ProductMatchScore } from '@/types/productMatching'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductDetailDialog } from '@/components/products/ProductDetailDialog'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { matchProductsForUser } from '@/lib/matching/products/productMatcher'
import { generateFollicleId } from '@/lib/analysis/follicleId'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Bookmark, ThumbsDown, Search, X } from 'lucide-react'
import { productsCache } from '@/lib/matching/products/productsCache'

const PRODUCTS_PER_PAGE = 24
const INITIAL_DISPLAY_LIMIT = 24

function SavedContent({ userData }: { userData: User }) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'saved'

  // All matches (full data)
  const [allMatches, setAllMatches] = useState({
    liked: [],
    saved: [],
    disliked: [],
  } as {
    liked: ProductMatchScore[]
    saved: ProductMatchScore[]
    disliked: ProductMatchScore[]
  })

  // Displayed matches (paginated)
  const [displayed, setDisplayed] = useState({
    liked: [],
    saved: [],
    disliked: [],
  } as {
    liked: ProductMatchScore[]
    saved: ProductMatchScore[]
    disliked: ProductMatchScore[]
  })

  // Pagination state
  const [pages, setPages] = useState({ liked: 1, saved: 1, disliked: 1 })

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // UI state
  const [selectedMatch, setSelectedMatch] = useState<ProductMatchScore | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Intersection observer refs
  const observerRefs = {
    liked: useRef<HTMLDivElement>(null),
    saved: useRef<HTMLDivElement>(null),
    disliked: useRef<HTMLDivElement>(null),
  }

  useEffect(() => {
    fetchUserProducts()
  }, [userData])

  // Update displayed items when page changes or search query changes
  useEffect(() => {
    const filterBySearch = (matches: ProductMatchScore[]) => {
      if (!searchQuery.trim()) return matches

      const query = searchQuery.toLowerCase()
      return matches.filter(
        (m) =>
          m.product.name.toLowerCase().includes(query) ||
          m.product.brand.toLowerCase().includes(query)
      )
    }

    setDisplayed({
      liked: filterBySearch(allMatches.liked).slice(
        0,
        pages.liked * PRODUCTS_PER_PAGE
      ),
      saved: filterBySearch(allMatches.saved).slice(
        0,
        pages.saved * PRODUCTS_PER_PAGE
      ),
      disliked: filterBySearch(allMatches.disliked).slice(
        0,
        pages.disliked * PRODUCTS_PER_PAGE
      ),
    })
  }, [allMatches, pages, searchQuery])

  // Reset pagination when search query changes
  useEffect(() => {
    setPages({ liked: 1, saved: 1, disliked: 1 })
  }, [searchQuery])

  const fetchUserProducts = async () => {
    try {
      const analysis = userData.hairAnalysis
      if (!analysis) return

      const follicleId = generateFollicleId(analysis)
      const productIds = {
        liked: userData.likedProducts || [],
        saved: userData.savedProducts || [],
        disliked: userData.dislikedProducts || [],
      }

      // Check cache first
      const cachedScores = productsCache.getAllScoredProducts(userData.userId)

      if (cachedScores) {
        console.log('✅ Using cached scores for saved page')
        setAllMatches({
          liked:
            productsCache.getScoredProducts(
              userData.userId,
              productIds.liked
            ) || [],
          saved:
            productsCache.getScoredProducts(
              userData.userId,
              productIds.saved
            ) || [],
          disliked:
            productsCache.getScoredProducts(
              userData.userId,
              productIds.disliked
            ) || [],
        })
      } else {
        // Cache miss - fetch and score products
        console.log('❌ No cached scores - fetching and scoring')
        const products = {
          liked: await fetchProductsInBatches(productIds.liked),
          saved: await fetchProductsInBatches(productIds.saved),
          disliked: await fetchProductsInBatches(productIds.disliked),
        }

        setAllMatches({
          liked: await matchProductsForUser(
            { hairAnalysis: analysis },
            products.liked,
            follicleId
          ),
          saved: await matchProductsForUser(
            { hairAnalysis: analysis },
            products.saved,
            follicleId
          ),
          disliked: await matchProductsForUser(
            { hairAnalysis: analysis },
            products.disliked,
            follicleId
          ),
        })
      }
    } catch (error) {
      console.error('Error fetching saved products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch products in batches of 10 (Firestore 'in' query limit)
  const fetchProductsInBatches = async (
    productIds: string[]
  ): Promise<Product[]> => {
    if (productIds.length === 0) return []

    const batches: string[][] = []
    for (let i = 0; i < productIds.length; i += 10) {
      batches.push(productIds.slice(i, i + 10))
    }

    const allProducts: Product[] = []
    for (const batch of batches) {
      const q = query(
        collection(db, 'products'),
        where('__name__', 'in', batch)
      )
      const snapshot = await getDocs(q)
      allProducts.push(
        ...snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Product
        )
      )
    }

    return allProducts
  }

  // Get filtered count for a type
  const getFilteredCount = (type: 'liked' | 'saved' | 'disliked') => {
    if (!searchQuery.trim()) return allMatches[type].length

    const query = searchQuery.toLowerCase()
    return allMatches[type].filter(
      (m) =>
        m.product.name.toLowerCase().includes(query) ||
        m.product.brand.toLowerCase().includes(query)
    ).length
  }

  // Load more function
  const loadMore = useCallback(
    (type: 'liked' | 'saved' | 'disliked') => {
      const filteredCount = getFilteredCount(type)
      if (displayed[type].length < filteredCount && !loadingMore) {
        setLoadingMore(true)
        setPages((prev) => ({ ...prev, [type]: prev[type] + 1 }))
        setLoadingMore(false)
      }
    },
    [displayed, searchQuery, allMatches, loadingMore]
  )

  // Intersection Observer setup
  useEffect(() => {
    const options = { root: null, rootMargin: '4000px' } // Margin for pre-loading

    const observers = Object.entries(observerRefs).map(([key, ref]) => {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMore(key as 'liked' | 'saved' | 'disliked')
        }
      }, options)

      if (ref.current) observer.observe(ref.current)
      return observer
    })

    return () => observers.forEach((observer) => observer.disconnect())
  }, [loadMore])

  // Render tab content
  const renderTabContent = (
    type: 'liked' | 'saved' | 'disliked',
    icon: any,
    emptyMessage: string
  ) => {
    const displayedMatches = displayed[type]
    const filteredCount = getFilteredCount(type)

    if (filteredCount === 0) {
      const Icon = icon
      const message = searchQuery.trim()
        ? `No products found matching "${searchQuery}"`
        : emptyMessage

      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>No products yet</EmptyTitle>
            <EmptyDescription>{message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    const hasMore = displayedMatches.length < filteredCount

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedMatches.map((match) => (
            <ProductCard
              key={match.product.id}
              match={match}
              onClick={() => setSelectedMatch(match)}
            />
          ))}
        </div>

        {/* Load more trigger */}
        {hasMore && (
          <div
            ref={observerRefs[type]}
            className="flex items-center justify-center py-8"
          >
            {loadingMore && <Spinner className="h-8 w-8" />}
          </div>
        )}

        {/* End of list indicator */}
        {!hasMore && displayedMatches.length > INITIAL_DISPLAY_LIMIT && (
          <div className="text-muted-foreground py-8 text-center text-sm">
            You've reached the end of your products
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My Products</h1>

      {/* Search Bar */}
      <div className="mb-6">
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

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved ({allMatches.saved.length})
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Liked ({allMatches.liked.length})
          </TabsTrigger>
          <TabsTrigger value="disliked" className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4" />
            Disliked ({allMatches.disliked.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved">
          {renderTabContent(
            'saved',
            Bookmark,
            'Save products to review later!'
          )}
        </TabsContent>

        <TabsContent value="liked">
          {renderTabContent(
            'liked',
            Heart,
            'Browse products and like ones that work for you!'
          )}
        </TabsContent>

        <TabsContent value="disliked">
          {renderTabContent(
            'disliked',
            ThumbsDown,
            "Mark products that don't work for you!"
          )}
        </TabsContent>
      </Tabs>

      <ProductDetailDialog
        match={selectedMatch}
        isOpen={selectedMatch !== null}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  )
}

export default function SavedPage() {
  return (
    <RequireAuth requireFollicleId>
      {(userData) => <SavedContent userData={userData} />}
    </RequireAuth>
  )
}
