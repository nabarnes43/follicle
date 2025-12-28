import { getServerUser } from '@/lib/server/auth'
import { getCachedAllRoutineScores } from '@/lib/server/routineScores'
import { getCachedPublicRoutines } from '@/lib/server/routines'
import { RoutineGrid } from '@/components/routines/RoutineGrid'
import { Header } from '@/components/shared/Header'
import { AnalysisPromptModal } from '@/components/analysis/AnalysisPromptModal'

export default async function PublicRoutinesPage() {
  const user = await getServerUser()

  // If user has analysis, show scored routines
  if (user?.follicleId) {
    const routines = await getCachedAllRoutineScores(user.userId)

    return (
      <div className="">
        <Header
          title="Browse Routines"
          subtitle={`Explore ${routines.length} hair care routines shared by the community`}
        />
        <RoutineGrid routines={routines} showMatchScore={true} />
      </div>
    )
  }

  // Otherwise, show all public routines without scores
  const routines = await getCachedPublicRoutines()

  // Convert to expected format (steps already have product data!)
  const routinesWithoutScores = routines.map((routine) => ({
    routine: {
      id: routine.id,
      name: routine.name,
      stepCount: routine.steps?.length || 0,
      frequency: {
        interval: routine.frequency.interval,
        unit: routine.frequency.unit,
      },
      userId: routine.user_id,
      isPublic: routine.is_public,
      steps:
        routine.steps?.map((step) => ({
          order: step.order,
          stepName: step.step_name,
          productId: step.product_id,
          productName: step.product_name,
          productBrand: step.product_brand,
          productImageUrl: step.product_image_url,
        })) || [],
    },
    totalScore: undefined,
    breakdown: {
      productScore: 0,
      engagementScore: 0,
    },
    matchReasons: [],
  }))

  return (
    <div>
      <AnalysisPromptModal
        shouldShow={!user?.follicleId}
        isAnonymous={user?.isAnonymous}
      />
      <Header
        title="Browse Routines"
        subtitle={`Explore ${routines.length} hair care routines shared by the community`}
      />
      <RoutineGrid
        routines={routinesWithoutScores}
        showMatchScore={false}
        hideSaveButton={true}
      />
    </div>
  )
}
