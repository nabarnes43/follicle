import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedRoutineScoresByIds } from '@/lib/server/routineScores'
import { PrivateRoutinesClient } from '@/components/routines/PrivateRoutinesClient'

export default async function PrivateRoutinesPage() {
  const user = await getServerUser()

  if (!user?.hairAnalysis || !user?.follicleId) {
    redirect('/analysis')
  }

  const routineIds = {
    created: user.createdRoutines || [],
    saved: user.savedRoutines || [],
    liked: user.likedRoutines || [],
    adapted: user.adaptedRoutines || [],
  }

  const [createdScores, savedScores, likedScores, adaptedScores] =
    await Promise.all([
      getCachedRoutineScoresByIds(user.userId, routineIds.created),
      getCachedRoutineScoresByIds(user.userId, routineIds.saved),
      getCachedRoutineScoresByIds(user.userId, routineIds.liked),
      getCachedRoutineScoresByIds(user.userId, routineIds.adapted),
    ])

  return (
    <PrivateRoutinesClient
      createdScores={createdScores}
      savedScores={savedScores}
      likedScores={likedScores}
      adaptedScores={adaptedScores}
    />
  )
}
