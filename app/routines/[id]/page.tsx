import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedRoutineById } from '@/lib/server/routines'
import {
  getCachedRoutineScoresByIds,
  serializeRoutine,
} from '@/lib/server/routineScores'
import { Routine } from '@/types/routine'
import { RoutineDetailClient } from '../../../components/routines/RoutineDetailClient'
import { getCachedScoresByIds } from '@/lib/server/productScores'
import { getCachedProductsByIds } from '@/lib/server/products'
import { adminDb } from '@/lib/firebase/admin'
import { AnalysisPromptModal } from '@/components/analysis/AnalysisPromptModal'

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()

  // Fetch routine from public cache
  const routine = await getCachedRoutineById(id)

  if (!routine) {
    notFound()
  }

  // Check privacy - if not public and user doesn't own it, redirect
  if (!routine.is_public && routine.user_id !== user?.userId) {
    redirect('/routines/public')
  }

  // Fetch author name
  const authorDoc = await adminDb.collection('users').doc(routine.user_id).get()
  const authorName = authorDoc.exists
    ? authorDoc.data()?.displayName || 'Anonymous'
    : '[Deleted User]'
  // Fetch adapted-from author if exists - handle deleted users
  let adaptedFromAuthor: string | null = null
  let adaptedFromUserId: string | null = null // Track the actual user ID
  if (routine.adaptedFrom) {
    const sourceDoc = await adminDb
      .collection('routines')
      .doc(routine.adaptedFrom)
      .get()
    if (sourceDoc.exists) {
      const sourceUserId = sourceDoc.data()?.user_id
      if (sourceUserId) {
        adaptedFromUserId = sourceUserId // Store it
        const sourceUserDoc = await adminDb
          .collection('users')
          .doc(sourceUserId)
          .get()
        adaptedFromAuthor = sourceUserDoc.exists
          ? sourceUserDoc.data()?.displayName || 'Anonymous'
          : '[Deleted User]'
      }
    }
  }

  const productIds = routine.steps
    .map((step) => step.product_id)
    .filter((id): id is string => !!id)

  // Fetch match score and products if user has analysis
  let matchScore = null
  let productsMap = {}

  if (
    user?.userId &&
    user?.follicleId &&
    user?.scoringStatus !== 'in_progress'
  ) {
    // Authenticated: fetch scored products and routine score
    matchScore =
      (await getCachedRoutineScoresByIds(user.userId, [id]))[0] || null
    const productScores = await getCachedScoresByIds(user.userId, productIds)
    productsMap = Object.fromEntries(
      productScores.map((score) => [score.product.id, score.product])
    )
  } else {
    // Not authenticated: fetch products without scores
    const products = await getCachedProductsByIds(productIds)
    productsMap = Object.fromEntries(
      products.map((product) => [product.id, product])
    )
  }

  return (
    <>
      <AnalysisPromptModal
        shouldShow={!user?.follicleId}
        isAnonymous={user?.isAnonymous}
      />
      <RoutineDetailClient
        routine={serializeRoutine(routine)}
        productsMap={productsMap}
        authorName={authorName}
        adaptedFromAuthor={adaptedFromAuthor}
        adaptedFromUserId={adaptedFromUserId}
        matchScore={matchScore}
        currentUserId={user?.userId}
      />
    </>
  )
}
