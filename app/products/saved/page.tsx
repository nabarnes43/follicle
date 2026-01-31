import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedScoresByIds } from '@/lib/server/productScores'
import { SavedProductsClient } from '@/components/products/SavedProductsClient'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'
import { AccessCodeForm } from '@/components/auth/AccessCodeForm'

export default async function SavedPage() {
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

  const productIds = {
    liked: user.likedProducts || [],
    saved: user.savedProducts || [],
    disliked: user.dislikedProducts || [],
  }

  const [liked, saved, disliked] = await Promise.all([
    getCachedScoresByIds(user.userId, productIds.liked),
    getCachedScoresByIds(user.userId, productIds.saved),
    getCachedScoresByIds(user.userId, productIds.disliked),
  ])

  return (
    <SavedProductsClient
      likedScores={liked}
      savedScores={saved}
      dislikedScores={disliked}
    />
  )
}
