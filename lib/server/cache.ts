import { revalidateTag } from 'next/cache'

/**
 * Invalidate all cached scores for a user
 * Call this after any interaction or analysis change
 */
export async function invalidateUserScores(userId: string) {
  await Promise.all([
    revalidateTag(`user-scores-${userId}`, 'max'),
    revalidateTag(`user-routine-scores-${userId}`, 'max'),
  ])

  console.log(`🔄 Invalidated caches for user ${userId}`)
}
