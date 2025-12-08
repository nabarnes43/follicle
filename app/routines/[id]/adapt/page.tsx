import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedAllScores } from '@/lib/server/productScores'
import { adminDb } from '@/lib/firebase/admin'
import { RoutineForm } from '@/components/routines/RoutineForm'
import { Routine } from '@/types/routine'

interface AdaptRoutinePageProps {
  params: {
    id: string
  }
}

export default async function AdaptRoutinePage({
  params,
}: AdaptRoutinePageProps) {
  const { id } = await params

  console.log('Fetching routine with ID:', id)

  if (!id || id.length === 0) {
    notFound() // Show a 404 page if the ID is missing or empty
  }

  // Get authenticated user
  const userData = await getServerUser()

  if (!userData) {
    redirect('/auth/signin')
  }

  if (!userData.follicleId) {
    redirect('/quiz')
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
