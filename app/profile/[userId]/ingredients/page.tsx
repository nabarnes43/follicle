import { notFound } from 'next/navigation'
import { getUserIngredientInteractions } from '@/lib/server/users'
import { SavedIngredientsClient } from '@/components/ingredients/SavedIngredientsClient'
import { adminDb } from '@/lib/firebase/admin'

interface PageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function UserIngredientsPage({ params }: PageProps) {
  const { userId } = await params

  // Fetch profile user's display name
  const profileUserDoc = await adminDb.collection('users').doc(userId).get()

  if (!profileUserDoc.exists) {
    notFound()
  }

  const profileUserData = profileUserDoc.data()
  const displayName = profileUserData?.displayName || 'Anonymous'

  // Fetch ingredient interactions for profile user
  const interactions = await getUserIngredientInteractions(userId)

  if (!interactions) {
    notFound()
  }

  return (
    <SavedIngredientsClient
      likedIngredients={interactions.liked}
      dislikedIngredients={interactions.disliked}
      avoidIngredients={interactions.avoid}
      allergicIngredients={interactions.allergic}
      profileUserDisplayName={displayName}
    />
  )
}
