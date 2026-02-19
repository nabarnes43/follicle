'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Search, X } from 'lucide-react'

const INITIAL_DISPLAY_LIMIT = 48
const LOAD_MORE_INCREMENT = 48

interface FilterConfig<T> {
  // How to extract the filterable value from an item
  getFilterValue: (item: T) => string

  // Filter options
  options: Array<{ value: string; label: string }>
  allValue?: string // e.g., 'all' - shows everything (optional)
}

interface BaseGridProps<T> {
  // Data
  items: T[]
  loading?: boolean

  // Rendering
  renderCard: (item: T, index: number) => React.ReactNode
  renderSkeleton: () => React.ReactNode
  gridClassName?: string // e.g., "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

  // Search
  searchPlaceholder?: string
  getSearchableText: (item: T) => string // Extract searchable text from item

  // Filters
  filters?: FilterConfig<T>[]

  // Empty State
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptyDescription: string

  // Pagination
  initialDisplayLimit?: number
  loadMoreIncrement?: number

  // Results count
  showResultsCount?: boolean
  resultsCountLabel?: (displayed: number, total: number) => string

  emptyAction?: React.ReactNode
}

export function BaseGrid<T>({
  items,
  emptyAction,
  loading = false,
  renderCard,
  renderSkeleton,
  gridClassName = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  searchPlaceholder = 'Search...',
  getSearchableText,
  filters = [],
  emptyIcon,
  emptyTitle,
  emptyDescription,
  initialDisplayLimit = INITIAL_DISPLAY_LIMIT,
  loadMoreIncrement = LOAD_MORE_INCREMENT,
  showResultsCount = true,
  resultsCountLabel = (displayed, total) =>
    `Showing ${displayed} of ${total.toLocaleString()}`,
}: BaseGridProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [displayLimit, setDisplayLimit] = useState(initialDisplayLimit)
  const [filterValues, setFilterValues] = useState<string[]>(
    filters?.map((f) => f.allValue || f.options[0]?.value || '') || []
  )
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Reset pagination when search or filters change
  useEffect(() => {
    setDisplayLimit(initialDisplayLimit)
  }, [searchQuery, filterValues, initialDisplayLimit])

  // Filter and paginate items
  const { displayedItems, totalCount } = useMemo(() => {
    let filtered = items

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((item) =>
        getSearchableText(item).toLowerCase().includes(query)
      )
    }

    // Apply custom filters
    if (filters && filters.length > 0) {
      filtered = filtered.filter((item) => {
        return filters.every((filter, idx) => {
          const selectedValue = filterValues[idx]
          // If "all" value selected, don't filter
          if (filter.allValue && selectedValue === filter.allValue) return true
          // Otherwise check if item matches selected filter value
          return filter.getFilterValue(item) === selectedValue
        })
      })
    }

    return {
      displayedItems: filtered.slice(0, displayLimit),
      totalCount: filtered.length,
    }
  }, [
    items,
    searchQuery,
    displayLimit,
    getSearchableText,
    filters,
    filterValues,
  ])

  // Infinite scroll observer
  useEffect(() => {
    const currentRef = loadMoreRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayLimit < totalCount) {
          setDisplayLimit((prev) => prev + loadMoreIncrement)
        }
      },
      { rootMargin: '200px', threshold: 0 }
    )

    if (currentRef) observer.observe(currentRef)
    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [displayLimit, totalCount, loadMoreIncrement])

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Filter Bar */}
      {(searchPlaceholder || filters.length > 0) && (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          {/* Search Input */}
          {searchPlaceholder && (
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
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
          )}

          {/* Filters */}
          {filters.map((filter, idx) => (
            <Select
              key={idx}
              value={filterValues[idx]}
              onValueChange={(value) => {
                const newValues = [...filterValues]
                newValues[idx] = value
                setFilterValues(newValues)
              }}
              disabled={loading}
            >
              <SelectTrigger className={'w-full sm:w-[200px]'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && totalCount > 0 && showResultsCount && (
        <div className="mb-4">
          <p className="text-muted-foreground text-sm">
            {resultsCountLabel(displayedItems.length, totalCount)}
          </p>
        </div>
      )}

      {/* Loading State - Skeleton Grid */}
      {loading && (
        <div className={`grid gap-6 ${gridClassName}`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>{renderSkeleton()}</div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && totalCount === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
            {emptyAction && <div className="mt-4">{emptyAction}</div>}
          </EmptyHeader>
        </Empty>
      )}

      {/* Items Grid */}
      {!loading && totalCount > 0 && (
        <>
          <div className={`grid gap-6 ${gridClassName}`}>
            {displayedItems.map((item, index) => (
              <div key={index}>{renderCard(item, index)}</div>
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
