import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedScoresByIds } from '@/lib/server/productScores'
import { SavedProductsClient } from '@/components/products/SavedProductsClient'
import { AnalysisRequired } from '@/components/auth/AnalysisRequired'

export default async function SavedPage() {
  const user = await getServerUser()

  // Check for follicleId (works for both anonymous and authenticated)
  if (!user?.follicleId) {
    return (
      <AnalysisRequired
        message="Complete your hair analysis to manage your products"
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
