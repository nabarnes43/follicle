'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IngredientCard } from '@/components/ingredients/IngredientCard'
import { IngredientCardSkeleton } from '@/components/ingredients/IngredientCardSkeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { INGREDIENT_FUNCTION_TYPES } from '@/lib/ingredients/config/functionTypes'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FlaskConical, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import type { Ingredient } from '@/types/ingredient'
import Fuse from 'fuse.js'
import { Skeleton } from '../ui/skeleton'

const INITIAL_DISPLAY_LIMIT = 48
const LOAD_MORE_INCREMENT = 48

interface IngredientsGridProps {
  ingredients: Ingredient[]
  loading?: boolean
}

export function IngredientsGrid({
  ingredients,
  loading = false,
}: IngredientsGridProps) {
  const router = useRouter()
  const [selectedFunctionType, setSelectedFunctionType] =
    useState<string>('all')
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT)
  const [searchQuery, setSearchQuery] = useState('')
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Initialize Fuse for search
  const fuse = useMemo(
    () =>
      new Fuse(ingredients, {
        keys: ['inciName', 'innName', 'functionType'],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [ingredients]
  )

  // Reset pagination when filter changes
  useEffect(() => {
    setDisplayLimit(INITIAL_DISPLAY_LIMIT)
  }, [selectedFunctionType, searchQuery])

  // Filter, sort, and paginate ingredients
  const { displayedIngredients, totalCount } = useMemo(() => {
    let filtered = ingredients

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = fuse.search(searchQuery).map((r) => r.item)
    }

    // Filter by function type
    if (selectedFunctionType !== 'all') {
      filtered = filtered.filter((i) =>
        i.functionType?.includes(selectedFunctionType)
      )
    }

    // Sort by product count (descending) - most common ingredients first
    filtered = [...filtered].sort(
      (a, b) => (b.product_count ?? 0) - (a.product_count ?? 0)
    )

    return {
      displayedIngredients: filtered.slice(0, displayLimit),
      totalCount: filtered.length,
    }
  }, [ingredients, searchQuery, selectedFunctionType, fuse, displayLimit])

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
    <div className="container mx-auto px-4 py-8">
      {/* Filters - Always Visible */}
      <div className="mb-8 flex gap-4">
        {/* Search Bar */}
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search by ingredient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            disabled={loading}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchQuery('')}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Function Type Filter */}
        <Select
          value={selectedFunctionType}
          onValueChange={setSelectedFunctionType}
          disabled={loading}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select function type" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">All Function Types</SelectItem>
            {INGREDIENT_FUNCTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Result Count */}
      {!loading && totalCount > 0 && (
        <div className="mb-4">
          <p className="text-muted-foreground text-sm">
            Showing {displayedIngredients.length} of{' '}
            {totalCount.toLocaleString()} ingredients
          </p>
        </div>
      )}

      {/* Loading State - Skeleton Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <IngredientCardSkeleton key={i} />
          ))}
        </div>
      ) : totalCount === 0 ? (
        /* Empty State */
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FlaskConical />
            </EmptyMedia>
            <EmptyTitle>No Ingredients Found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filter criteria.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {/* Ingredient Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedIngredients.map((ingredient) => (
              <IngredientCard
                key={ingredient.id}
                ingredient={ingredient}
                onClick={() => router.push(`/ingredients/${ingredient.id}`)}
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
