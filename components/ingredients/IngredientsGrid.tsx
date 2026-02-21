'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { IngredientCard } from '@/components/ingredients/IngredientCard'
import { IngredientCardSkeleton } from '@/components/ingredients/IngredientCardSkeleton'
import { BaseGrid } from '@/components/shared/BaseGrid'
import {
  IngredientFilterSidecar,
  IngredientFilterState,
  DEFAULT_INGREDIENT_FILTER_STATE,
} from '@/components/ingredients/IngredientFilterSidecar'
import { FlaskConical } from 'lucide-react'
import type { Ingredient } from '@/types/ingredient'

interface IngredientsGridProps {
  ingredients: Ingredient[]
  loading?: boolean
}

export function IngredientsGrid({
  ingredients,
  loading = false,
}: IngredientsGridProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<IngredientFilterState>(
    DEFAULT_INGREDIENT_FILTER_STATE
  )

  const activeFilterCount = [
    filters.functionType !== 'all',
    filters.sort !== 'products_asc',
  ].filter(Boolean).length

  const processedIngredients = useMemo(() => {
    if (filters.sort === 'products_asc') return ingredients
    return [...ingredients].sort((a, b) => {
      const pa = a.product_count ?? 0
      const pb = b.product_count ?? 0
      return filters.sort === 'products_asc' ? pa - pb : pb - pa
    })
  }, [ingredients, filters.sort])

  return (
    <BaseGrid
      items={processedIngredients}
      loading={loading}
      gridClassName="grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      searchPlaceholder="Search by ingredient name..."
      getSearchableText={(ingredient) =>
        `${ingredient.inciName} ${ingredient.innName || ''} ${ingredient.functionType || ''}`
      }
      category={filters.functionType}
      getCategory={(ingredient) => ingredient.functionType || ''}
      sidecar={
        <IngredientFilterSidecar
          state={filters}
          onChange={setFilters}
          activeFilterCount={activeFilterCount}
        />
      }
      emptyIcon={<FlaskConical />}
      emptyTitle="No Ingredients Found"
      emptyDescription="Try adjusting your search or filter criteria."
      renderCard={(ingredient) => (
        <IngredientCard
          ingredient={ingredient}
          onClick={() => router.push(`/ingredients/${ingredient.id}`)}
        />
      )}
      renderSkeleton={() => <IngredientCardSkeleton />}
      resultsCountLabel={(displayed, total) =>
        `Showing ${displayed} of ${total.toLocaleString()} ingredients`
      }
    />
  )
}
