'use client'

import { useRouter } from 'next/navigation'
import { Ingredient } from '@/types/ingredient'
import { IngredientsGrid } from '@/components/ingredients/IngredientsGrid'
import { SavedPageLayout } from '@/components/shared/SavedPageLayout'
import { Heart, ThumbsDown, Ban, AlertTriangle } from 'lucide-react'

interface SavedIngredientsClientProps {
  likedIngredients: Ingredient[]
  dislikedIngredients: Ingredient[]
  avoidIngredients: Ingredient[]
  allergicIngredients: Ingredient[]
  loading?: boolean
  profileUserDisplayName?: string
}

export function SavedIngredientsClient({
  likedIngredients,
  dislikedIngredients,
  avoidIngredients,
  allergicIngredients,
  loading = false,
  profileUserDisplayName,
}: SavedIngredientsClientProps) {
  // Determine title based on context
  const title = profileUserDisplayName
    ? `${profileUserDisplayName}'s Ingredients`
    : 'Saved Ingredients'

  const subtitle = profileUserDisplayName
    ? 'Ingredient preferences and sensitivities'
    : 'Your ingredient preferences and sensitivities'

  return (
    <SavedPageLayout
      title={title}
      subtitle={subtitle}
      showBackButton={!!profileUserDisplayName}
      tabs={[
        {
          value: 'liked',
          label: 'Liked',
          icon: <Heart className="h-4 w-4" />,
          count: likedIngredients.length,
          content: (
            <IngredientsGrid ingredients={likedIngredients} loading={loading} />
          ),
        },
        {
          value: 'disliked',
          label: 'Disliked',
          icon: <ThumbsDown className="h-4 w-4" />,
          count: dislikedIngredients.length,
          content: (
            <IngredientsGrid
              ingredients={dislikedIngredients}
              loading={loading}
            />
          ),
        },
        {
          value: 'avoid',
          label: 'Avoid',
          icon: <Ban className="h-4 w-4" />,
          count: avoidIngredients.length,
          content: (
            <IngredientsGrid ingredients={avoidIngredients} loading={loading} />
          ),
        },
        {
          value: 'allergic',
          label: 'Allergic',
          icon: <AlertTriangle className="h-4 w-4" />,
          count: allergicIngredients.length,
          content: (
            <IngredientsGrid
              ingredients={allergicIngredients}
              loading={loading}
            />
          ),
        },
      ]}
    />
  )
}
