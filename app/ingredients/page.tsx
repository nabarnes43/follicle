import { getCachedAllIngredients } from '@/lib/server/ingredients'
import { IngredientsGrid } from '@/components/ingredients/IngredientsGrid'
import { Header } from '@/components/navigation/Header'
import { AnalysisPromptModal } from '@/components/analysis/AnalysisPromptModal'
import { getServerUser } from '@/lib/server/auth'

export default async function IngredientsPage() {
  const user = await getServerUser()
  const ingredients = await getCachedAllIngredients()

  return (
    <div>
      <AnalysisPromptModal
        shouldShow={!user?.follicleId}
        isAnonymous={user?.isAnonymous}
      />
      <Header
        title="Ingredient Database"
        subtitle={`Browse ${ingredients.length.toLocaleString()} ingredients and track your preferences`}
      />
      <IngredientsGrid ingredients={ingredients} />
    </div>
  )
}
