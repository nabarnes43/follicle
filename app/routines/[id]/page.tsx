import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { adminDb } from '@/lib/firebase/admin'
import {
  getCachedRoutineScoresByIds,
  serializeRoutine,
} from '@/lib/server/routineScores'
import { Routine } from '@/types/routine'
import { RoutineDetailClient } from '../../../components/routines/RoutineDetailClient'
import { getCachedScoresByIds } from '@/lib/server/productScores'

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()

  // Fetch routine directly
  const routineDoc = await adminDb.collection('routines').doc(id).get()

  if (!routineDoc.exists) {
    notFound()
  }

  const routine = { id: routineDoc.id, ...routineDoc.data() } as Routine

  // Check privacy
  if (!routine.is_public && routine.user_id !== user?.userId) {
    redirect('/routines/public')
  }

  // Fetch author name
  const authorDoc = await adminDb.collection('users').doc(routine.user_id).get()
  const authorName = authorDoc.exists
    ? authorDoc.data()?.displayName || 'Anonymous'
    : 'Anonymous'

  // Fetch adapted-from author if exists should be stored later
  let adaptedFromAuthor: string | null = null
  if (routine.adaptedFrom) {
    const sourceDoc = await adminDb
      .collection('routines')
      .doc(routine.adaptedFrom)
      .get()
    if (sourceDoc.exists) {
      const sourceUserId = sourceDoc.data()?.user_id
      if (sourceUserId) {
        const sourceUserDoc = await adminDb
          .collection('users')
          .doc(sourceUserId)
          .get()
        adaptedFromAuthor = sourceUserDoc.data()?.displayName || 'Anonymous'
      }
    }
  }

  // Fetch match score if user has analysis
  const matchScore =
    user?.userId && user?.hairAnalysis && user?.follicleId
      ? (await getCachedRoutineScoresByIds(user.userId, [id]))[0]
      : null

  const productIds = routine.steps
    .map((step) => step.product_id)
    .filter((id): id is string => !!id)

  // Fetch product data from scores (includes name, brand, image_url)
  const productScores = user?.userId
    ? await getCachedScoresByIds(user.userId, productIds)
    : []

  // Convert to simple Object for lookup
  const productsMap = Object.fromEntries(
    productScores.map((score) => [score.product.id, score.product])
  )

  return (
    <RoutineDetailClient
      routine={serializeRoutine(routine)}
      productsMap={productsMap}
      authorName={authorName}
      adaptedFromAuthor={adaptedFromAuthor}
      matchScore={matchScore}
      currentUserId={user?.userId}
    />
  )
}
