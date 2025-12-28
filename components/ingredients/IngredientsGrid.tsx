'use client'

import { useRouter } from 'next/navigation'
import { IngredientCard } from '@/components/ingredients/IngredientCard'
import { IngredientCardSkeleton } from '@/components/ingredients/IngredientCardSkeleton'
import { BaseGrid } from '@/components/shared/BaseGrid'
import { FlaskConical } from 'lucide-react'
import type { Ingredient } from '@/types/ingredient'
import { INGREDIENT_FUNCTION_TYPES } from '@/lib/constants/functionTypes'

interface IngredientsGridProps {
  ingredients: Ingredient[]
  loading?: boolean
}

export function IngredientsGrid({
  ingredients,
  loading = false,
}: IngredientsGridProps) {
  const router = useRouter()

  return (
    <BaseGrid
      items={ingredients}
      loading={loading}
      gridClassName="grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      searchPlaceholder="Search by ingredient name..."
      getSearchableText={(ingredient) =>
        `${ingredient.inciName} ${ingredient.innName || ''} ${ingredient.functionType || ''}`
      }
      filters={[
        {
          getFilterValue: (ingredient) => ingredient.functionType || '',
          options: [
            { value: 'all', label: 'All Function Types' },
            ...INGREDIENT_FUNCTION_TYPES.map((type) => ({
              value: type,
              label: type,
            })),
          ],
          allValue: 'all',
        },
      ]}
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
