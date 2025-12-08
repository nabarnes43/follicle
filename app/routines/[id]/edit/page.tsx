import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedAllScores } from '@/lib/server/productScores'
import { adminDb } from '@/lib/firebase/admin'
import { RoutineForm } from '@/components/routines/RoutineForm'
import { Routine } from '@/types/routine'
import { serializeRoutine } from '@/lib/server/routineScores'

interface EditRoutinePageProps {
  params: {
    id: string
  }
}

export default async function EditRoutinePage({
  params,
}: EditRoutinePageProps) {
  const { id } = await params

  // Get authenticated user
  const userData = await getServerUser()

  if (!userData) {
    redirect('/auth/signin')
  }

  if (!userData.follicleId) {
    redirect('/quiz')
  }

  // Fetch the routine
  const routineDoc = await adminDb.collection('routines').doc(id).get()

  if (!routineDoc.exists) {
    notFound()
  }

  const routine = {
    id: routineDoc.id,
    ...routineDoc.data(),
  } as Routine

  // Verify ownership
  if (routine.user_id !== userData.userId) {
    redirect('/routines/private')
  }

  // Fetch user's product scores
  const productScores = await getCachedAllScores(userData.userId)

  return (
    <RoutineForm
      mode="edit"
      routineId={id}
      initialRoutine={serializeRoutine(routine)}
      userData={userData}
      productScores={productScores}
    />
  )
}
