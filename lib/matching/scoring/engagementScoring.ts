import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { Product } from '@/types/product'
import { ProductInteraction } from '@/types/interaction'
import { calculateFollicleSimilarity } from './follicleSimilarity'
import {
  ENGAGEMENT_WEIGHTS,
  ENGAGEMENT_NORMALIZATION,
  MIN_SIMILARITY_THRESHOLD,
  MATCH_REASONS_CONFIG,
} from '../config/weights'

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
    // Query interactions for this product (limit to prevent overload)
    const interactionsRef = collection(db, 'interactions')
    const productInteractionsQuery = query(
      interactionsRef,
      where('productId', '==', product.id),
      limit(100) // Limit to first 100 interactions
    )

    const snapshot = await getDocs(productInteractionsQuery)

    // If no interactions yet, return neutral score
    if (snapshot.empty) {
      return { score: 0.5, reasons }
    }

    // Calculate weighted score based on follicle similarity
    let totalWeightedScore = 0
    let totalWeight = 0
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

      // Get weight for this interaction type
      const interactionWeight = ENGAGEMENT_WEIGHTS[interaction.type] || 0
      // Weight by both interaction type AND user similarity
      const weightedValue = interactionWeight * similarity

      totalWeightedScore += weightedValue
      totalWeight += similarity
      interactionCount++
    })

    // Calculate final score
    let finalScore = 0.5 // Default neutral

    if (
      totalWeight > 0 &&
      interactionCount >= ENGAGEMENT_NORMALIZATION.minViews
    ) {
      // Average weighted score
      const averageScore = totalWeightedScore / totalWeight

      // Normalize to 0-1 range
      finalScore = Math.max(0, Math.min(1, (averageScore + 0.65) / 1.3))
    }

    // Add reasons if requested
    if (includeReasons) {
      const totalSimilar = interactionCount

      if (similarityBuckets.exact > 0) {
        reasons.push(
          `${similarityBuckets.exact} ${similarityBuckets.exact === 1 ? 'person' : 'people'} with identical hair loved this`
        )
      } else if (similarityBuckets.veryHigh + similarityBuckets.high > 5) {
        reasons.push(`Loved by ${totalSimilar} people with very similar hair`)
      } else if (totalSimilar > 2) {
        reasons.push(`Liked by ${totalSimilar} people with similar hair`)
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
