import { getCachedAllIngredients } from '@/lib/server/ingredients'
import { IngredientsGrid } from '@/components/ingredients/IngredientsGrid'
import { Header } from '@/components/navigation/Header'

export default async function IngredientsPage() {
  const ingredients = await getCachedAllIngredients()

  return (
    <div>
      <Header
        title="Ingredient Database"
        subtitle={`Browse ${ingredients.length.toLocaleString()} ingredients and track your preferences`}
      />
      <IngredientsGrid ingredients={ingredients} />
    </div>
  )
}
