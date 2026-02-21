'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories'

export type SortOption = 'default' | 'price_asc' | 'price_desc'

export interface FilterSidecarState {
  sort: SortOption
  maxPrice: number | null
  category: string
}

export const DEFAULT_FILTER_STATE: FilterSidecarState = {
  sort: 'default',
  maxPrice: null,
  category: 'all',
}

const PRICE_PRESETS = [10, 25, 50, 100]

interface ProductFilterSidecarProps {
  state: FilterSidecarState
  onChange: (state: FilterSidecarState) => void
  activeFilterCount: number
}

export function ProductFilterSidecar({
  state,
  onChange,
  activeFilterCount,
}: ProductFilterSidecarProps) {
  const [customPrice, setCustomPrice] = useState('')
  const [usingCustom, setUsingCustom] = useState(false)

  const set = (patch: Partial<FilterSidecarState>) =>
    onChange({ ...state, ...patch })

  const handleReset = () => {
    onChange(DEFAULT_FILTER_STATE)
    setCustomPrice('')
    setUsingCustom(false)
  }

  const content = (
    <div className="flex flex-col gap-6 p-4">
      {/* Sort */}
      <div>
        <p className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Sort By
        </p>
        <div className="flex flex-col gap-1">
          {[
            { value: 'default', label: 'Recommended' },
            { value: 'price_asc', label: 'Price: Low to High' },
            { value: 'price_desc', label: 'Price: High to Low' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => set({ sort: option.value as SortOption })}
              className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                state.sort === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <hr />

      {/* Max Price */}
      <div>
        <p className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Max Price
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setUsingCustom(false)
                setCustomPrice('')
                set({ maxPrice: state.maxPrice === preset ? null : preset })
              }}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                state.maxPrice === preset && !usingCustom
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-muted'
              }`}
            >
              Under ${preset}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">$</span>
          <input
            type="number"
            min={0}
            placeholder="Custom max"
            value={customPrice}
            onChange={(e) => {
              setUsingCustom(true)
              setCustomPrice(e.target.value)
              set({
                maxPrice: e.target.value === '' ? null : Number(e.target.value),
              })
            }}
            className="border-input focus:ring-ring w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      <hr />

      {/* Category */}
      <div>
        <p className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
          Category
        </p>
        <div className="flex flex-col gap-1">
          {['All Categories', ...PRODUCT_CATEGORIES].map((cat) => {
            const value = cat === 'All Categories' ? 'all' : cat
            return (
              <button
                key={value}
                onClick={() => set({ category: value })}
                className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  state.category === value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 w-40 gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between pr-8">
          <SheetTitle>Filters</SheetTitle>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset all
            </Button>
          )}
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}
