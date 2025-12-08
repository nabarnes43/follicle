'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Star } from 'lucide-react'
import { PreComputedProductMatchScore } from '@/types/productMatching'
import Fuse from 'fuse.js'

interface ProductSearchProps {
  onSelect: (match: PreComputedProductMatchScore) => void // Pass full match object
  placeholder?: string
  excludeIds?: string[]
  savedProductIds?: string[]
  likedProductIds?: string[]
  productScores: PreComputedProductMatchScore[] // Required prop
}

export function ProductSearch({
  onSelect,
  placeholder = 'Search products by name or brand...',
  excludeIds = [],
  savedProductIds = [],
  likedProductIds = [],
  productScores, 
}: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PreComputedProductMatchScore[]>([])
  const [quickAccessMatches, setQuickAccessMatches] = useState<
    PreComputedProductMatchScore[]
  >([])
  const [isOpen, setIsOpen] = useState(false)
  const [fuse, setFuse] = useState<Fuse<PreComputedProductMatchScore> | null>(
    null
  )

  // Initialize Fuse with productScores
  useEffect(() => {
    // Create Fuse instance for fuzzy search on product name and brand
    const fuseInstance = new Fuse(productScores, {
      keys: ['product.name', 'product.brand'],
      threshold: 0.3,
      ignoreLocation: true,
    })
    setFuse(fuseInstance)

    // Combine saved + liked (unique IDs only)
    const combinedIds = [...new Set([...savedProductIds, ...likedProductIds])]
    const quickAccess = productScores.filter(
      (ps) =>
        combinedIds.includes(ps.product.id) &&
        !excludeIds.includes(ps.product.id)
    )
    setQuickAccessMatches(quickAccess)
  }, [
    productScores,
    savedProductIds.join(','),
    likedProductIds.join(','),
    excludeIds.join(','),
  ])

  // Search with debounce
  useEffect(() => {
    if (!query.trim() || !fuse) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      const filtered = fuse
        .search(query)
        .map((r) => r.item)
        .filter((ps) => !excludeIds.includes(ps.product.id))
        .slice(0, 20)
      setResults(filtered)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, fuse, excludeIds.join(',')])

  const handleSelect = (match: PreComputedProductMatchScore) => {
    onSelect(match)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  // Determine what to show in dropdown
  const showQuickAccess = !query.trim() && quickAccessMatches.length > 0
  const showSearchResults = query.trim() && results.length > 0
  const showNoResults = query.trim() && results.length === 0
  const showEmptyState = !query.trim() && quickAccessMatches.length === 0

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="pr-9 pl-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="bg-popover text-popover-foreground absolute top-full z-50 mt-1 max-h-[300px] w-full overflow-auto rounded-md border shadow-md">
          {/* Quick Access (Saved + Liked) */}
          {showQuickAccess && (
            <div className="py-1">
              <div className="text-muted-foreground flex items-center gap-1 px-3 py-2 text-xs font-semibold">
                <Star className="h-3 w-3 fill-current" />
                Saved & Liked Products
              </div>
              {quickAccessMatches.map((match) => (
                <button
                  key={match.product.id}
                  onClick={() => handleSelect(match)}
                  className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2 text-left"
                >
                  {match.product.image_url ? (
                    <img
                      src={match.product.image_url}
                      alt={match.product.name}
                      className="h-12 w-12 rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                      <span className="text-xs text-gray-400">No img</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">
                      {match.product.brand}
                    </p>
                    <p className="truncate text-sm font-medium">
                      {match.product.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {match.product.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {showSearchResults && (
            <div className="py-1">
              {quickAccessMatches.length > 0 && (
                <div className="text-muted-foreground border-t px-3 py-2 text-xs font-semibold">
                  All Products
                </div>
              )}
              {results.map((match) => (
                <button
                  key={match.product.id}
                  onClick={() => handleSelect(match)}
                  className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2 text-left"
                >
                  {match.product.image_url ? (
                    <img
                      src={match.product.image_url}
                      alt={match.product.name}
                      className="h-12 w-12 rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                      <span className="text-xs text-gray-400">No img</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">
                      {match.product.brand}
                    </p>
                    <p className="truncate text-sm font-medium">
                      {match.product.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {match.product.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {showEmptyState && (
            <div className="text-muted-foreground p-4 text-center text-sm">
              <p>Start typing to search products</p>
            </div>
          )}

          {/* No results */}
          {showNoResults && (
            <div className="text-muted-foreground p-4 text-center text-sm">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
