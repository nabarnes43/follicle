import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedIngredientsByIds } from '@/lib/server/ingredients'
import { SavedIngredientsClient } from '@/components/ingredients/SavedIngredientsClient'

export default async function SavedIngredientsPage() {
  const user = await getServerUser()

  if (!user?.userId) {
    redirect('/login')
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
