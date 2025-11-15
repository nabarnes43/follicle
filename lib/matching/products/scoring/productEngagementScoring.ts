import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { Product } from '@/types/product'
import { ProductInteraction } from '@/types/productInteraction'
import { calculateFollicleSimilarity } from '../../shared/follicleSimilarity'
import {
  ENGAGEMENT_WEIGHTS,
  MIN_SIMILARITY_THRESHOLD,
  MATCH_REASONS_CONFIG,
} from '../config/productWeights'

/**
 * Score a product based on engagement from users with similar hair
 * Uses fuzzy follicle matching - closer matches = more weight
 *
 * IMPORTANT: This is expensive! Only call when you have interaction data.
 * For MVP with no data, use neutral score (0.5)
 */
export async function scoreByEngagement(
  product: Product,
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
    // Query interactions for this product
    const interactionsRef = collection(db, 'product_interactions')
    const productInteractionsQuery = query(
      interactionsRef,
      where('productId', '==', product.id)
    )

    const snapshot = await getDocs(productInteractionsQuery)

    // If no interactions yet, return neutral score
    if (snapshot.empty) {
      return { score: 0.5, reasons }
    }

    // Calculate rate-based scoring with weighted interactions
    let weightedRoutine = 0
    let weightedSave = 0
    let weightedLike = 0
    let weightedDislike = 0
    let weightedReroll = 0
    let weightedViews = 0
    let interactionCount = 0

    const similarityBuckets = {
      exact: 0,
      veryHigh: 0,
      high: 0,
      medium: 0,
    }

    snapshot.forEach((doc) => {
      const interaction = doc.data() as ProductInteraction

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
      if (interaction.type === 'routine') {
        weightedRoutine += similarity
      } else if (interaction.type === 'save') {
        weightedSave += similarity
      } else if (interaction.type === 'like') {
        weightedLike += similarity
      } else if (interaction.type === 'dislike') {
        weightedDislike += similarity
      } else if (interaction.type === 'reroll') {
        weightedReroll += similarity
      } else if (interaction.type === 'view') {
        weightedViews += similarity
      }

      interactionCount++
    })

    // Calculate final score
    let finalScore = 0.5 // Default neutral

    if (weightedViews > 0) {
      // Calculate rates (action / views)
      const routineRate = weightedRoutine / weightedViews
      const saveRate = weightedSave / weightedViews
      const likeRate = weightedLike / weightedViews
      const dislikeRate = weightedDislike / weightedViews
      const rerollRate = weightedReroll / weightedViews

      // Apply engagement weights
      const score =
        routineRate * ENGAGEMENT_WEIGHTS.routine +
        saveRate * ENGAGEMENT_WEIGHTS.save +
        likeRate * ENGAGEMENT_WEIGHTS.like +
        dislikeRate * ENGAGEMENT_WEIGHTS.dislike +
        rerollRate * ENGAGEMENT_WEIGHTS.reroll

      // Normalize to 0-1 range (score + 0.5, clamped)
      finalScore = Math.max(0, Math.min(1, score + 0.5))
    }

    // Add reasons if requested
    if (includeReasons) {
      // Map interaction types to their weighted counts and labels
      const interactionReasons = [
        {
          type: 'routine',
          count: Math.round(weightedRoutine),
          weight: weightedRoutine,
        },
        {
          type: 'saved',
          count: Math.round(weightedSave),
          weight: weightedSave,
        },
        {
          type: 'liked',
          count: Math.round(weightedLike),
          weight: weightedLike,
        },
      ]

      // Generate reasons for each positive interaction type
      interactionReasons.forEach(({ type, count }) => {
        if (count > 0) {
          reasons.push(
            `${count} ${count === 1 ? 'person' : 'people'} with identical hair ${type} this`
          )
        }
      })

      // Fallback for high/medium similarity if no exact matches
      const hasExactMatches = interactionReasons.some(({ count }) => count > 0)
      if (!hasExactMatches) {
        const totalSimilar = interactionCount
        if (similarityBuckets.veryHigh + similarityBuckets.high > 5) {
          reasons.push(`Loved by ${totalSimilar} people with very similar hair`)
        } else if (totalSimilar > 2) {
          reasons.push(`Liked by ${totalSimilar} people with similar hair`)
        }
      }
    }

    // Limit reasons
    const limitedReasons = reasons.slice(
      0,
      MATCH_REASONS_CONFIG.maxReasonsTotal
    )

    return {
      score: finalScore,
      reasons: limitedReasons,
      similarityMetrics: {
        exact: similarityBuckets.exact,
        veryHigh: similarityBuckets.veryHigh,
        high: similarityBuckets.high,
        medium: similarityBuckets.medium,
        totalSimilar: interactionCount,
      },
    }
  } catch (error) {
    console.error('Error calculating engagement score:', error)
    // Return neutral score on error
    return { score: 0.5, reasons: [] }
  }
}
