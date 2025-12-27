import { notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getUserProductInteractionsWithScores } from '@/lib/server/users'
import { SavedProductsClient } from '@/components/products/SavedProductsClient'

interface PageProps {
  params: Promise<{
    userId: string
  }>
}

import { adminDb } from '@/lib/firebase/admin'

export default async function UserProductsPage({ params }: PageProps) {
  const { userId } = await params
  const currentUser = await getServerUser()

  // Fetch profile user's display name
  const profileUserDoc = await adminDb.collection('users').doc(userId).get()

  if (!profileUserDoc.exists) {
    notFound()
  }

  const profileUserData = profileUserDoc.data()
  const displayName = profileUserData?.displayName || 'Anonymous'

  // Fetch product interactions for profile user, scored for current viewer
  const interactions = await getUserProductInteractionsWithScores(
    userId,
    currentUser?.userId || null,
    currentUser?.follicleId || null
  )

  if (!interactions) {
    notFound()
  }

  return (
    <SavedProductsClient
      likedScores={interactions.liked}
      savedScores={interactions.saved}
      dislikedScores={interactions.disliked}
      profileUserDisplayName={displayName}
    />
  )
}
