import { Routine } from '../../types/routine'
import { RoutineInteraction } from '../../types/routineInteraction'
import { calculateFollicleSimilarity } from '../../shared/follicleSimilarity'
import {
  ROUTINE_ENGAGEMENT_WEIGHTS,
  MIN_SIMILARITY_THRESHOLD,
  SIMILARITY_THRESHOLDS,
  ENGAGEMENT_SCORE_DEFAULTS,
  MATCH_REASONS_CONFIG,
} from '../config/routineWeights'

export interface RoutineInteractionsByTier {
  exact: { adapt: number; save: number; like: number }
  veryHigh: { adapt: number; save: number; like: number }
  high: { adapt: number; save: number; like: number }
  medium: { adapt: number; save: number; like: number }
}

/**
 * Score a routine based on engagement from users with similar hair
 */
export async function scoreRoutineByEngagement(
  routine: Routine,
  userFollicleId: string,
  includeReasons: boolean = true,
  db: FirebaseFirestore.Firestore
): Promise<{
  score: number
  reasons: string[]
  interactionsByTier?: RoutineInteractionsByTier
}> {
  const reasons: string[] = []
  try {
    const snapshot = await db
      .collection('routine_interactions')
      .where('routineId', '==', routine.id)
      .get()

    if (snapshot.empty) {
      return { score: ENGAGEMENT_SCORE_DEFAULTS.NEUTRAL_SCORE, reasons }
    }

    let weightedAdapt = 0
    let weightedSave = 0
    let weightedLike = 0
    let weightedDislike = 0
    let weightedViews = 0

    const interactionsByTier: RoutineInteractionsByTier = {
      exact: { adapt: 0, save: 0, like: 0 },
      veryHigh: { adapt: 0, save: 0, like: 0 },
      high: { adapt: 0, save: 0, like: 0 },
      medium: { adapt: 0, save: 0, like: 0 },
    }

    snapshot.forEach((doc) => {
      const interaction = doc.data() as RoutineInteraction

      const similarity = calculateFollicleSimilarity(
        userFollicleId,
        interaction.follicleId
      )

      if (similarity < MIN_SIMILARITY_THRESHOLD) {
        return
      }

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

      if (interaction.type === 'adapt') {
        weightedAdapt += similarity
        interactionsByTier[tier].adapt++
      } else if (interaction.type === 'save') {
        weightedSave += similarity
        interactionsByTier[tier].save++
      } else if (interaction.type === 'like') {
        weightedLike += similarity
        interactionsByTier[tier].like++
      } else if (interaction.type === 'dislike') {
        weightedDislike += similarity
      } else if (interaction.type === 'view') {
        weightedViews += similarity
      }
    })

    let finalScore = ENGAGEMENT_SCORE_DEFAULTS.NEUTRAL_SCORE

    if (weightedViews > 0) {
      const adaptRate = weightedAdapt / weightedViews
      const saveRate = weightedSave / weightedViews
      const likeRate = weightedLike / weightedViews
      const dislikeRate = weightedDislike / weightedViews

      const score =
        adaptRate * ROUTINE_ENGAGEMENT_WEIGHTS.adapt +
        saveRate * ROUTINE_ENGAGEMENT_WEIGHTS.save +
        likeRate * ROUTINE_ENGAGEMENT_WEIGHTS.like +
        dislikeRate * ROUTINE_ENGAGEMENT_WEIGHTS.dislike

      finalScore = Math.max(
        ENGAGEMENT_SCORE_DEFAULTS.MIN_SCORE,
        Math.min(ENGAGEMENT_SCORE_DEFAULTS.MAX_SCORE, score + 0.5)
      )
    }

    if (includeReasons) {
      const tiers = [
        { label: 'identical', key: 'exact' as const },
        { label: 'nearly identical', key: 'veryHigh' as const },
        { label: 'very similar', key: 'high' as const },
        { label: 'similar', key: 'medium' as const },
      ]

      for (const tier of tiers) {
        const interactions = interactionsByTier[tier.key]

        if (interactions.adapt > 0) {
          reasons.push(
            `${interactions.adapt} ${interactions.adapt === 1 ? 'person' : 'people'} with ${tier.label} hair adapted this routine`
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
    console.error('Error calculating routine engagement score:', error)
    return { score: ENGAGEMENT_SCORE_DEFAULTS.NEUTRAL_SCORE, reasons: [] }
  }
}
