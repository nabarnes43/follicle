import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedAllScores } from '@/lib/server/productScores'
import { RoutineForm } from '@/components/routines/RoutineForm'

export default async function CreateRoutinePage() {
  // Get authenticated user
  const userData = await getServerUser()

  // Redirect if not authenticated or no follicleId
  if (!userData) {
    redirect('/auth/signin')
  }

  if (!userData.follicleId) {
    redirect('/quiz')
  }

  // Fetch user's product scores
  const productScores = await getCachedAllScores(userData.userId)

  return (
    <RoutineForm
      mode="create"
      userData={userData}
      productScores={productScores}
    />
  )
}
