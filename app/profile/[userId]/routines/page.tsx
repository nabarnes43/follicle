import { notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getUserRoutineInteractionsWithScores } from '@/lib/server/users'
import { PrivateRoutinesClient } from '@/components/routines/PrivateRoutinesClient'
import { adminDb } from '@/lib/firebase/admin'

interface PageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function UserRoutinesPage({ params }: PageProps) {
  const { userId } = await params
  const currentUser = await getServerUser()

  // Fetch profile user's display name
  const profileUserDoc = await adminDb.collection('users').doc(userId).get()

  if (!profileUserDoc.exists) {
    notFound()
  }

  const profileUserData = profileUserDoc.data()
  const displayName = profileUserData?.displayName || 'Anonymous'

  // Fetch routine interactions for profile user, scored for current viewer
  const interactions = await getUserRoutineInteractionsWithScores(
    userId,
    currentUser?.userId || null,
    currentUser?.follicleId || null
  )

  if (!interactions) {
    notFound()
  }

  return (
    <PrivateRoutinesClient
      createdScores={interactions.created}
      savedScores={interactions.saved}
      likedScores={interactions.liked}
      dislikedScores={interactions.disliked}
      adaptedScores={interactions.adapted}
      profileUserDisplayName={displayName}
    />
  )
}
