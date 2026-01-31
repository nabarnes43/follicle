import { getServerUser } from '@/lib/server/auth'
import { getCachedRoutineScoresByIds } from '@/lib/server/routineScores'
import { PrivateRoutinesClient } from '@/components/routines/PrivateRoutinesClient'
import { headers } from 'next/headers'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'
import { AccessCodeForm } from '@/components/auth/AccessCodeForm'

export default async function PrivateRoutinesPage() {
  const user = await getServerUser()
  headers()

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
