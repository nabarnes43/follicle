'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { IngredientCard } from '@/components/ingredients/IngredientCard'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { ingredientsCache } from '@/lib/ingredients/ingredientsCache'
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
import type { Ingredient } from '@/types/ingredient'
import Fuse from 'fuse.js'
import { useRouter } from 'next/navigation'

const INITIAL_DISPLAY_LIMIT = 48
const LOAD_MORE_INCREMENT = 48

export default function IngredientsPage() {
  // Data state
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [selectedFunctionType, setSelectedFunctionType] =
    useState<string>('all')
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [fuse, setFuse] = useState<Fuse<Ingredient> | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const router = useRouter()

  // Infinite scroll trigger
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch ingredients once on mount
  useEffect(() => {
    const fetchIngredients = async () => {
      setIsLoading(true)
      try {
        const ingredients = await ingredientsCache.getIngredients()
        setAllIngredients(ingredients)

        // Initialize Fuse for search
        setFuse(
          new Fuse(ingredients, {
            keys: ['inciName', 'innName', 'functionType'],
            threshold: 0.3,
            ignoreLocation: true,
          })
        )
      } catch (error) {
        console.error('Failed to fetch ingredients:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchIngredients()
  }, [])

  // Reset pagination when filter changes
  useEffect(() => {
    setDisplayLimit(INITIAL_DISPLAY_LIMIT)
  }, [selectedFunctionType, searchQuery])

  // Filter, sort, and paginate ingredients
  const { displayedIngredients, totalCount } = useMemo(() => {
    let filtered = allIngredients

    // Filter by search query
    if (searchQuery.trim() && fuse) {
      filtered = fuse.search(searchQuery).map((r) => r.item)
    }

    // Filter by function type (check if functionType contains the selected type)
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
  }, [allIngredients, searchQuery, selectedFunctionType, fuse, displayLimit])

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
            Loading ingredients...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Ingredient Database</h1>
        <p className="text-muted-foreground">
          Browse {allIngredients.length.toLocaleString()} ingredients and track
          your preferences
        </p>
      </div>

      {/* Filters */}
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

        {/* Function Type Filter */}
        <Select
          value={selectedFunctionType}
          onValueChange={setSelectedFunctionType}
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
      {totalCount > 0 && (
        <div className="mb-4">
          <p className="text-muted-foreground text-sm">
            Showing {displayedIngredients.length} of{' '}
            {totalCount.toLocaleString()} ingredients
          </p>
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 ? (
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
