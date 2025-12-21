import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedAllScores } from '@/lib/server/productScores'
import { adminDb } from '@/lib/firebase/admin'
import { RoutineForm } from '@/components/routines/RoutineForm'
import { Routine } from '@/types/routine'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'

interface AdaptRoutinePageProps {
  params: {
    id: string
  }
}

export default async function AdaptRoutinePage({
  params,
}: AdaptRoutinePageProps) {
  const { id } = await params

  if (!id || id.length === 0) {
    notFound()
  }

  const userData = await getServerUser()

  if (!userData?.follicleId) {
    return (
      <AnalysisRequired message="Complete your hair analysis to adapt routines" />
    )
  }

  // Fetch the source routine
  const routineDoc = await adminDb.collection('routines').doc(id).get()

  if (!routineDoc.exists) {
    notFound()
  }

  const sourceRoutine = {
    id: routineDoc.id,
    ...routineDoc.data(),
  } as Routine

  // Create adapted routine (new ID, user's ownership)
  const adaptedRoutine: Routine = {
    ...sourceRoutine,
    id: '', // Will be generated on save
    user_id: userData.userId,
    follicle_id: userData.follicleId,
    name: `${sourceRoutine.name} (Adaptation)`,
    is_public: false,
    adaptedFrom: id,
    created_at: new Date(),
    updated_at: new Date(),
  }

  // Fetch user's product scores
  const productScores = await getCachedAllScores(userData.userId)

  return (
    <RoutineForm
      mode="adapt"
      routineId={id}
      initialRoutine={adaptedRoutine}
      userData={userData}
      productScores={productScores}
    />
  )
}
