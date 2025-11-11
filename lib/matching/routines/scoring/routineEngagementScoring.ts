import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { Routine } from '@/types/routine'
import { RoutineInteraction } from '@/types/routineInteraction'
import { calculateFollicleSimilarity } from '../../shared/follicleSimilarity'
import {
  ROUTINE_ENGAGEMENT_WEIGHTS,
  MIN_SIMILARITY_THRESHOLD,
} from '../config/routineWeights'

/**
 * Score a routine based on engagement from users with similar hair
 * Uses rate-based scoring: (interactions / views) weighted by similarity
 *
 * Pattern matches product engagement scoring but for routines
 *
 * @param routine - Routine to score
 * @param userFollicleId - Current user's follicle ID
 * @param includeReasons - Whether to generate match reasons
 * @returns Score (0-1), reasons, and similarity metrics
 */
export async function scoreRoutineByEngagement(
  routine: Routine,
  userFollicleId: string,
  includeReasons: boolean = true
): Promise<{
  score: number
  reasons: string[]
  similarityMetrics?: {
    exact: number
    veryHigh: number
    high: number
    medium: number
    totalSimilar: number
  }
}> {
  const reasons: string[] = []

  try {
    // Query interactions for this routine (limit to prevent overload)
    const interactionsRef = collection(db, 'routine_interactions')
    const routineInteractionsQuery = query(
      interactionsRef,
      where('routineId', '==', routine.id),
    )

    const snapshot = await getDocs(routineInteractionsQuery)

    // If no interactions yet, return neutral score
    if (snapshot.empty) {
      return { score: 0.5, reasons }
    }

    // Calculate rate-based scoring with weighted interactions
    let weightedAdapt = 0
    let weightedSave = 0
    let weightedLike = 0
    let weightedDislike = 0
    let weightedViews = 0
    let interactionCount = 0

    const similarityBuckets = {
      exact: 0,
      veryHigh: 0,
      high: 0,
      medium: 0,
    }

    snapshot.forEach((doc) => {
      const interaction = doc.data() as RoutineInteraction

      // Calculate how similar this user is
      const similarity = calculateFollicleSimilarity(
        userFollicleId,
        interaction.follicleId
      )

      // Skip users below similarity threshold
      if (similarity < MIN_SIMILARITY_THRESHOLD) {
        return
      }

      // Track similarity distribution
      if (similarity === 1.0) {
        similarityBuckets.exact++
      } else if (similarity > 0.8) {
        similarityBuckets.veryHigh++
      } else if (similarity > 0.6) {
        similarityBuckets.high++
      } else {
        similarityBuckets.medium++
      }

      // Weight interactions by similarity
      if (interaction.type === 'adapt') {
        weightedAdapt += similarity
      } else if (interaction.type === 'save') {
        weightedSave += similarity
      } else if (interaction.type === 'like') {
        weightedLike += similarity
      } else if (interaction.type === 'dislike') {
        weightedDislike += similarity
      } else if (interaction.type === 'view') {
        weightedViews += similarity
      }

      interactionCount++
    })

    // Calculate final score using rates
    let finalScore = 0.5 // Default neutral

    if (weightedViews > 0) {
      // Calculate rates (action / views)
      const adaptRate = weightedAdapt / weightedViews
      const saveRate = weightedSave / weightedViews
      const likeRate = weightedLike / weightedViews
      const dislikeRate = weightedDislike / weightedViews

      // Apply engagement weights
      const score =
        adaptRate * ROUTINE_ENGAGEMENT_WEIGHTS.adapt +
        saveRate * ROUTINE_ENGAGEMENT_WEIGHTS.save +
        likeRate * ROUTINE_ENGAGEMENT_WEIGHTS.like +
        dislikeRate * ROUTINE_ENGAGEMENT_WEIGHTS.dislike

      // Normalize to 0-1 range (score + 0.5, clamped)
      finalScore = Math.max(0, Math.min(1, score + 0.5))
    }

    // Add reasons if requested
    if (includeReasons) {
      const totalSimilar = interactionCount

      if (similarityBuckets.exact > 0) {
        reasons.push(
          `${similarityBuckets.exact} ${similarityBuckets.exact === 1 ? 'person' : 'people'} with identical hair loved this routine`
        )
      } else if (similarityBuckets.veryHigh + similarityBuckets.high > 5) {
        reasons.push(`Loved by ${totalSimilar} people with very similar hair`)
      } else if (totalSimilar > 2) {
        reasons.push(`Liked by ${totalSimilar} people with similar hair`)
      }

      // Add adapt-specific reason (strongest signal)
      if (weightedAdapt > 0 && weightedViews > 0) {
        const adaptRate = weightedAdapt / weightedViews
        if (adaptRate > 0.2) {
          // 20%+ adapt rate
          reasons.push(
            `${Math.round(adaptRate * 100)}% of similar users adapted this routine`
          )
        }
      }
    }

    return {
      score: finalScore,
      reasons,
      similarityMetrics: {
        exact: similarityBuckets.exact,
        veryHigh: similarityBuckets.veryHigh,
        high: similarityBuckets.high,
        medium: similarityBuckets.medium,
        totalSimilar: interactionCount,
      },
    }
  } catch (error) {
    console.error('Error calculating routine engagement score:', error)
    // Return neutral score on error
    return { score: 0.5, reasons: [] }
  }
}
