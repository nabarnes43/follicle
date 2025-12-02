import { getFirestore } from 'firebase-admin/firestore'
import { Product } from '../types/product'
import { ProductInteraction } from '../types/productInteraction'
import { calculateFollicleSimilarity } from '../utils/follicleSimilarity'
import {
  ENGAGEMENT_WEIGHTS,
  MIN_SIMILARITY_THRESHOLD,
  MATCH_REASONS_CONFIG,
  ENGAGEMENT_SCORE_DEFAULTS,
  SIMILARITY_THRESHOLDS,
} from '../config/productWeights'

export interface InteractionsByTier {
  exact: { routine: number; save: number; like: number }
  veryHigh: { routine: number; save: number; like: number }
  high: { routine: number; save: number; like: number }
  medium: { routine: number; save: number; like: number }
}

/**
 * Score a product based on engagement from users with similar hair
 * Uses fuzzy follicle matching - closer matches = more weight
 */
export async function scoreByEngagement(
  product: Product,
  userFollicleId: string,
  includeReasons: boolean = true
): Promise<{
  score: number
  reasons: string[]
  interactionsByTier?: InteractionsByTier
}> {
  const reasons: string[] = []
  const adminDb = getFirestore()

  try {
    // Query interactions for this product
    const snapshot = await adminDb
      .collection('product_interactions')
      .where('productId', '==', product.id)
      .get()

    // If no interactions yet, return neutral score
    if (snapshot.empty) {
      return { score: ENGAGEMENT_SCORE_DEFAULTS.NEUTRAL_SCORE, reasons }
    }

    // Calculate rate-based scoring with weighted interactions
    let weightedRoutine = 0
    let weightedSave = 0
    let weightedLike = 0
    let weightedDislike = 0
    let weightedReroll = 0
    let weightedViews = 0

    // Track interactions per similarity tier (only meaningful actions)
    const interactionsByTier: InteractionsByTier = {
      exact: { routine: 0, save: 0, like: 0 },
      veryHigh: { routine: 0, save: 0, like: 0 },
      high: { routine: 0, save: 0, like: 0 },
      medium: { routine: 0, save: 0, like: 0 },
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

      // Determine tier
      let tier: 'exact' | 'veryHigh' | 'high' | 'medium'
      if (similarity === SIMILARITY_THRESHOLDS.exact) {
        tier = 'exact'
      } else if (similarity > SIMILARITY_THRESHOLDS.veryHigh) {
        tier = 'veryHigh'
      } else if (similarity > SIMILARITY_THRESHOLDS.high) {
        tier = 'high'
      } else {
        tier = 'medium'
      }

      // Weight interactions by similarity for scoring
      // Only track meaningful actions in interactionsByTier
      if (interaction.type === 'routine') {
        weightedRoutine += similarity
        interactionsByTier[tier].routine++
      } else if (interaction.type === 'save') {
        weightedSave += similarity
        interactionsByTier[tier].save++
      } else if (interaction.type === 'like') {
        weightedLike += similarity
        interactionsByTier[tier].like++
      } else if (interaction.type === 'dislike') {
        weightedDislike += similarity
      } else if (interaction.type === 'reroll') {
        weightedReroll += similarity
      } else if (interaction.type === 'view') {
        weightedViews += similarity
      }
    })

    // Calculate final score
    let finalScore = ENGAGEMENT_SCORE_DEFAULTS.NEUTRAL_SCORE

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
      finalScore = Math.max(
        ENGAGEMENT_SCORE_DEFAULTS.MIN_SCORE,
        Math.min(ENGAGEMENT_SCORE_DEFAULTS.MAX_SCORE, score + 0.5)
      )
    }

    // Add reasons if requested
    if (includeReasons) {
      const tiers = [
        { label: 'identical', key: 'exact' as const },
        { label: 'nearly identical', key: 'veryHigh' as const },
        { label: 'very similar', key: 'high' as const },
        { label: 'similar', key: 'medium' as const },
      ]

      for (const tier of tiers) {
        const interactions = interactionsByTier[tier.key]

        if (interactions.routine > 0) {
          reasons.push(
            `${interactions.routine} ${interactions.routine === 1 ? 'person' : 'people'} with ${tier.label} hair added to routine`
          )
        }
        if (interactions.save > 0) {
          reasons.push(
            `${interactions.save} ${interactions.save === 1 ? 'person' : 'people'} with ${tier.label} hair saved this`
          )
        }
        if (interactions.like > 0) {
          reasons.push(
            `${interactions.like} ${interactions.like === 1 ? 'person' : 'people'} with ${tier.label} hair liked this`
          )
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
      interactionsByTier,
    }
  } catch (error) {
    console.error('Error calculating engagement score:', error)
    return { score: ENGAGEMENT_SCORE_DEFAULTS.NEUTRAL_SCORE, reasons: [] }
  }
}
