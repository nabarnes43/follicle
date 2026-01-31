import { getServerUser } from '@/lib/server/auth'
import { getCachedAllScores } from '@/lib/server/productScores'
import { RoutineForm } from '@/components/routines/RoutineForm'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'
import { AccessCodeForm } from '@/components/auth/AccessCodeForm'

export default async function CreateRoutinePage() {
  const user = await getServerUser()

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
  
  const productScores = await getCachedAllScores(user.userId)

  return (
    <RoutineForm mode="create" userData={user} productScores={productScores} />
  )
}
