import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedRoutineScoresByIds } from '@/lib/server/routineScores'
import { PrivateRoutinesClient } from '@/components/routines/PrivateRoutinesClient'
import { headers } from 'next/headers'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'

export default async function PrivateRoutinesPage() {
  const user = await getServerUser()
  headers()

  if (!user?.follicleId) {
    return (
      <AnalysisRequired message="Complete your hair analysis to manage your routines" />
    )
  }

  const routineIds = {
    created: user.createdRoutines || [],
    saved: user.savedRoutines || [],
    liked: user.likedRoutines || [],
    disliked: user.dislikedRoutines || [],
    adapted: user.adaptedRoutines || [],
  }

  const [
    createdScores,
    savedScores,
    likedScores,
    dislikedScores,
    adaptedScores,
  ] = await Promise.all([
    getCachedRoutineScoresByIds(user.userId, routineIds.created),
    getCachedRoutineScoresByIds(user.userId, routineIds.saved),
    getCachedRoutineScoresByIds(user.userId, routineIds.liked),
    getCachedRoutineScoresByIds(user.userId, routineIds.disliked),
    getCachedRoutineScoresByIds(user.userId, routineIds.adapted),
  ])

  return (
    <PrivateRoutinesClient
      createdScores={createdScores}
      savedScores={savedScores}
      likedScores={likedScores}
      dislikedScores={dislikedScores}
      adaptedScores={adaptedScores}
    />
  )
}
