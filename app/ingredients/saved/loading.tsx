import { SavedIngredientsClient } from '@/components/ingredients/SavedIngredientsClient'

export default function SavedIngredientsLoading() {
  return (
    <SavedIngredientsClient
      likedIngredients={[]}
      dislikedIngredients={[]}
      avoidIngredients={[]}
      allergicIngredients={[]}
      loading={true}
    />
  )
}
