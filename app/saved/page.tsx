'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { User } from '@/types/user'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { Product } from '@/types/product'
import { MatchScore } from '@/types/matching'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductDetailDialog } from '@/components/products/ProductDetailDialog'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { matchProductsForUser } from '@/lib/matching/productMatcher'
import { generateFollicleId } from '@/lib/analysis/follicleId'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Bookmark, ThumbsDown } from 'lucide-react'
import { productsCache } from '@/lib/matching/productsCache'

function SavedContent({ userData }: { userData: User }) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'saved'

  // Data
  const [likedMatches, setLikedMatches] = useState<MatchScore[]>([])
  const [savedMatches, setSavedMatches] = useState<MatchScore[]>([])
  const [dislikedMatches, setDislikedMatches] = useState<MatchScore[]>([])

  // UI
  const [selectedMatch, setSelectedMatch] = useState<MatchScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserProducts()
  }, [userData])

  const fetchUserProducts = async () => {
    try {
      const analysis = userData.hairAnalysis
      if (!analysis) return

      const follicleId = generateFollicleId(analysis)

      // Get product IDs from userData
      const likedIds = userData.likedProducts || []
      const savedIds = userData.savedProducts || []
      const dislikedIds = userData.dislikedProducts || []

      // Check cache first using userId
      const cachedScores = productsCache.getAllScoredProducts(userData.userId)

      if (cachedScores) {
        // Use cached scores - instant!
        console.log('✅ Using cached scores for saved page')
        const likedScored =
          productsCache.getScoredProducts(userData.userId, likedIds) || []
        const savedScored =
          productsCache.getScoredProducts(userData.userId, savedIds) || []
        const dislikedScored =
          productsCache.getScoredProducts(userData.userId, dislikedIds) || []

        setLikedMatches(likedScored)
        setSavedMatches(savedScored)
        setDislikedMatches(dislikedScored)
      } else {
        // Cache miss - fetch and score products
        console.log('❌ No cached scores - fetching and scoring')
        const likedProducts = await fetchProductsInBatches(likedIds)
        const savedProducts = await fetchProductsInBatches(savedIds)
        const dislikedProducts = await fetchProductsInBatches(dislikedIds)

        const likedScored = await matchProductsForUser(
          { hairAnalysis: analysis },
          likedProducts,
          follicleId,
          { limit: 9999 }
        )
        const savedScored = await matchProductsForUser(
          { hairAnalysis: analysis },
          savedProducts,
          follicleId,
          { limit: 9999 }
        )
        const dislikedScored = await matchProductsForUser(
          { hairAnalysis: analysis },
          dislikedProducts,
          follicleId,
          { limit: 9999 }
        )

        setLikedMatches(likedScored)
        setSavedMatches(savedScored)
        setDislikedMatches(dislikedScored)
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

  // Render tab content
  const renderTabContent = (
    matches: MatchScore[],
    icon: any,
    emptyMessage: string
  ) => {
    if (matches.length === 0) {
      const Icon = icon
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>No products yet</EmptyTitle>
            <EmptyDescription>{emptyMessage}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {matches.map((match) => (
          <ProductCard
            key={match.product.id}
            match={match}
            onClick={() => setSelectedMatch(match)}
          />
        ))}
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

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved ({savedMatches.length})
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Liked ({likedMatches.length})
          </TabsTrigger>
          <TabsTrigger value="disliked" className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4" />
            Disliked ({dislikedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved">
          {renderTabContent(
            savedMatches,
            Bookmark,
            'Save products to review later!'
          )}
        </TabsContent>

        <TabsContent value="liked">
          {renderTabContent(
            likedMatches,
            Heart,
            'Browse products and like ones that work for you!'
          )}
        </TabsContent>

        <TabsContent value="disliked">
          {renderTabContent(
            dislikedMatches,
            ThumbsDown,
            "Mark products that don't work for you!"
          )}
        </TabsContent>
      </Tabs>

      {/* Product Detail Dialog */}
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
