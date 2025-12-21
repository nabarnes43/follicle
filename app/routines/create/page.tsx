import { getServerUser } from '@/lib/server/auth'
import { getCachedAllScores } from '@/lib/server/productScores'
import { RoutineForm } from '@/components/routines/RoutineForm'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'

export default async function CreateRoutinePage() {
  const userData = await getServerUser()

  // Check for follicleId (works for both anonymous and authenticated)
  if (!userData?.follicleId) {
    return (
      <AnalysisRequired message="Complete your hair analysis to create personalized routines" />
    )
  }

  const productScores = await getCachedAllScores(userData.userId)

  return (
    <RoutineForm
      mode="create"
      userData={userData}
      productScores={productScores}
    />
  )
}
