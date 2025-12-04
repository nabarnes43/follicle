import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedAllRoutineScores } from '@/lib/server/routineScores'
import { RoutineGrid } from '@/components/routines/RoutineGrid'

export default async function PublicRoutinesPage() {
  const user = await getServerUser()

  if (!user?.hairAnalysis || !user?.follicleId) {
    redirect('/analysis')
  }

  const routines = await getCachedAllRoutineScores(user.userId)

  return (
    <div className="">
      <div className="container mx-auto px-4 py-4">
        <h1 className="mb-2 text-3xl font-bold">Browse Routines</h1>
        <p className="text-muted-foreground">
          Discover hair care routines shared by the community
        </p>
      </div>
      <RoutineGrid routines={routines} showMatchScore={true} />
    </div>
  )
}
