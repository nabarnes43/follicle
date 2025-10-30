'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { Product } from '@/types/product'
import { productsCache } from '@/lib/matching/productsCache'
import Fuse from 'fuse.js'

interface ProductSearchProps {
  onSelect: (product: Product) => void
  placeholder?: string
  excludeIds?: string[]
}

export function ProductSearch({
  onSelect,
  placeholder = 'Search products by name or brand...',
  excludeIds = [],
}: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [fuse, setFuse] = useState<Fuse<Product> | null>(null)

  // Initialize Fuse once
  useEffect(() => {
    productsCache.getProducts().then((products) => {
      setFuse(
        new Fuse(products, {
          keys: ['name', 'brand'],
          threshold: 0.3,
          ignoreLocation: true,
        })
      )
    })
  }, [])

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
        .filter((p) => !excludeIds.includes(p.id))
        .slice(0, 20)
      setResults(filtered)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, fuse, excludeIds.join(',')])

  const handleSelect = (product: Product) => {
    onSelect(product)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

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

      {isOpen && query && (
        <div className="bg-popover text-popover-foreground absolute top-full z-50 mt-1 max-h-[300px] w-full overflow-auto rounded-md border shadow-md">
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="hover:bg-accent flex w-full items-center gap-3 px-3 py-2 text-left"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-12 w-12 rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                      <span className="text-xs text-gray-400">No img</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">
                      {product.brand}
                    </p>
                    <p className="truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {product.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground p-4 text-center text-sm">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
