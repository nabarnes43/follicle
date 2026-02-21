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
import { INGREDIENT_FUNCTION_TYPES } from '@/lib/constants/functionTypes'

export interface IngredientFilterState {
  functionType: string
  sort: 'products_asc' | 'products_desc'
}

export const DEFAULT_INGREDIENT_FILTER_STATE: IngredientFilterState = {
  functionType: 'all',
  sort: 'products_asc',
}

interface IngredientFilterSidecarProps {
  state: IngredientFilterState
  onChange: (state: IngredientFilterState) => void
  activeFilterCount: number
}

export function IngredientFilterSidecar({
  state,
  onChange,
  activeFilterCount,
}: IngredientFilterSidecarProps) {
  const set = (patch: Partial<IngredientFilterState>) =>
    onChange({ ...state, ...patch })

  const handleReset = () => onChange(DEFAULT_INGREDIENT_FILTER_STATE)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 w-40 gap-2">
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
        <div className="flex flex-col gap-6 p-4">
          {/* Sort */}
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
              Sort By
            </p>
            <div className="flex flex-col gap-1">
              {[
                { value: 'products_asc', label: 'Products: Low to High' },
                { value: 'products_desc', label: 'Products: High to Low' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    set({ sort: option.value as IngredientFilterState['sort'] })
                  }
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

          {/* Function Type */}
          <div>
            <p className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
              Function Type
            </p>
            <div className="flex flex-col gap-1">
              {['All Function Types', ...INGREDIENT_FUNCTION_TYPES].map(
                (type) => {
                  const value = type === 'All Function Types' ? 'all' : type
                  return (
                    <button
                      key={value}
                      onClick={() => set({ functionType: value })}
                      className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        state.functionType === value
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {type}
                    </button>
                  )
                }
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
