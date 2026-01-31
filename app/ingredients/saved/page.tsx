import { getServerUser } from '@/lib/server/auth'
import { getCachedIngredientsByIds } from '@/lib/server/ingredients'
import { SavedIngredientsClient } from '@/components/ingredients/SavedIngredientsClient'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'
import { AccessCodeForm } from '@/components/auth/AccessCodeForm'

export default async function SavedIngredientsPage() {
  const user = await getServerUser()

  // Needs access code (everyone, including anonymous)
  if (!user?.accessCode) {
    return <AccessCodeForm />
  }

  // Needs analysis
  if (!user?.follicleId) {
    return (
      <AnalysisRequired
        showSignInPrompt={user?.isAnonymous}
      />
    )
  }

  const ingredientIds = {
    liked: user.likedIngredients || [],
    disliked: user.dislikedIngredients || [],
    avoid: user.avoidIngredients || [],
    allergic: user.allergicIngredients || [],
  }

  const [liked, disliked, avoid, allergic] = await Promise.all([
    getCachedIngredientsByIds(ingredientIds.liked),
    getCachedIngredientsByIds(ingredientIds.disliked),
    getCachedIngredientsByIds(ingredientIds.avoid),
    getCachedIngredientsByIds(ingredientIds.allergic),
  ])

  return (
    <SavedIngredientsClient
      likedIngredients={liked}
      dislikedIngredients={disliked}
      avoidIngredients={avoid}
      allergicIngredients={allergic}
    />
  )
}
