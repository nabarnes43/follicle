import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedIngredientsByIds } from '@/lib/server/ingredients'
import { SavedIngredientsClient } from '@/components/ingredients/SavedIngredientsClient'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'

export default async function SavedIngredientsPage() {
  const user = await getServerUser()

  // Check for follicleId (works for both anonymous and authenticated)
  if (!user?.follicleId) {
    return (
      <AnalysisRequired
        message="Complete your hair analysis to manage your ingredients"
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
