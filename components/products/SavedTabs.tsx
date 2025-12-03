'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PreComputedProductMatchScore } from '@/types/productMatching'
import { ProductCard } from '@/components/products/ProductCard'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Bookmark, ThumbsDown, Search, X } from 'lucide-react'

const PRODUCTS_PER_PAGE = 48

interface SavedTabsProps {
  liked: PreComputedProductMatchScore[]
  saved: PreComputedProductMatchScore[]
  disliked: PreComputedProductMatchScore[]
}

export default function SavedTabs({ liked, saved, disliked }: SavedTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'saved'

  const allMatches = { liked, saved, disliked }

  const [displayed, setDisplayed] = useState({
    liked: liked.slice(0, PRODUCTS_PER_PAGE),
    saved: saved.slice(0, PRODUCTS_PER_PAGE),
    disliked: disliked.slice(0, PRODUCTS_PER_PAGE),
  })

  const [pages, setPages] = useState({ liked: 1, saved: 1, disliked: 1 })
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)

  const observerRefs = {
    liked: useRef<HTMLDivElement>(null),
    saved: useRef<HTMLDivElement>(null),
    disliked: useRef<HTMLDivElement>(null),
  }

  useEffect(() => {
    const filterBySearch = (matches: PreComputedProductMatchScore[]) => {
      if (!searchQuery.trim()) return matches
      const q = searchQuery.toLowerCase()
      return matches.filter(
        (m) =>
          m.product.name.toLowerCase().includes(q) ||
          m.product.brand.toLowerCase().includes(q)
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
  }, [pages, searchQuery, liked, saved, disliked])

  useEffect(() => {
    setPages({ liked: 1, saved: 1, disliked: 1 })
  }, [searchQuery])

  const getFilteredCount = (type: 'liked' | 'saved' | 'disliked') => {
    if (!searchQuery.trim()) return allMatches[type].length
    const q = searchQuery.toLowerCase()
    return allMatches[type].filter(
      (m) =>
        m.product.name.toLowerCase().includes(q) ||
        m.product.brand.toLowerCase().includes(q)
    ).length
  }

  const loadMore = useCallback(
    (type: 'liked' | 'saved' | 'disliked') => {
      const filteredCount = getFilteredCount(type)
      if (displayed[type].length < filteredCount && !loadingMore) {
        setLoadingMore(true)
        setPages((prev) => ({ ...prev, [type]: prev[type] + 1 }))
        setLoadingMore(false)
      }
    },
    [displayed, searchQuery, loadingMore]
  )

  useEffect(() => {
    const options = { root: null, rootMargin: '4000px' }

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

  const renderTabContent = (
    type: 'liked' | 'saved' | 'disliked',
    Icon: any,
    emptyMessage: string
  ) => {
    const displayedMatches = displayed[type]
    const filteredCount = getFilteredCount(type)

    if (filteredCount === 0) {
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
              product={match.product}
              matchScore={match.totalScore}
              onClick={() => router.push(`/products/${match.product.id}`)}
              hideSaveButton={true}
            />
          ))}
        </div>

        {hasMore && (
          <div
            ref={observerRefs[type]}
            className="flex items-center justify-center py-8"
          >
            {loadingMore && <Spinner className="h-8 w-8" />}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Saved Products</h1>

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
            Saved ({saved.length})
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Liked ({liked.length})
          </TabsTrigger>
          <TabsTrigger value="disliked" className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4" />
            Disliked ({disliked.length})
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
    </div>
  )
}
