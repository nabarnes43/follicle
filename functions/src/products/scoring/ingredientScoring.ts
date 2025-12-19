import { Product } from '../../types/product'
import {
  decodeFollicleIdForDisplay,
  decodeFollicleIdToAnalysis,
} from '../../shared/follicleId'
import { INGREDIENT_PROFILES } from '../config/ingredientProfiles'
import {
  INGREDIENT_CATEGORY_WEIGHTS,
  SCORING_MODIFIERS,
  MATCH_REASONS_CONFIG,
  getPositionScore,
} from '../config/productWeights'

/** TODO update the analysis to use ID and the decode ID rather than the actual user analysis well still store the analysis but dont need it for scoring
 * Score a product based on its ingredients for a specific user
 * Uses the "Lego system" - each hair characteristic scores independently
 *
 * @param product - Product to score
 * @param follicleId - User's hair characteristics
 * @param includeReasons - Whether to generate match reasons (for display)
 * @returns Score from 0.0 to 1.0 and optional match reasons
 */
export function scoreByIngredients(
  product: Product,
  follicleId: string,
  includeReasons: boolean = false
): {
  score: number
  reasons: string[]
} {
  const allReasons: string[] = []

  // Handle missing ingredient data
  if (
    !product.ingredients_normalized ||
    product.ingredients_normalized.length === 0
  ) {
    if (includeReasons) {
      allReasons.push('⚠️ Ingredient data not available')
    }
    return {
      score: SCORING_MODIFIERS.noIngredientData,
      reasons: allReasons,
    }
  }

  // Normalize product ingredients to lowercase for matching
  const productIngredients = product.ingredients_normalized.map((ing) =>
    ing.toLowerCase()
  )
  const totalIngredients = productIngredients.length

  // Decode follicle ID
  const decodedFollicleIdProfiles = decodeFollicleIdToAnalysis(follicleId)
  // Display names
  const decodedFollicleIdDisplay = decodeFollicleIdForDisplay(follicleId)

  if (!decodedFollicleIdProfiles || !decodedFollicleIdDisplay) {
    // Fallback if decode fails
    if (includeReasons) {
      allReasons.push('⚠️ Could not analyze hair profile')
    }
    return {
      score: SCORING_MODIFIERS.noIngredientData,
      reasons: allReasons,
    }
  }

  // Score each hair characteristic independently (Lego system)
  const categoryScores = {
    hairType: scoreCategoryMatch(
      productIngredients,
      totalIngredients,
      INGREDIENT_PROFILES.hairType[decodedFollicleIdProfiles.hairType],
      decodedFollicleIdDisplay.hairType, // "curly hair"
      includeReasons ? allReasons : null
    ),
    porosity: scoreCategoryMatch(
      productIngredients,
      totalIngredients,
      INGREDIENT_PROFILES.porosity[decodedFollicleIdProfiles.porosity],
      decodedFollicleIdDisplay.porosity, // "high porosity"
      includeReasons ? allReasons : null
    ),
    density: scoreCategoryMatch(
      productIngredients,
      totalIngredients,
      INGREDIENT_PROFILES.density[decodedFollicleIdProfiles.density],
      decodedFollicleIdDisplay.density, // "medium density"
      includeReasons ? allReasons : null
    ),
    thickness: scoreCategoryMatch(
      productIngredients,
      totalIngredients,
      INGREDIENT_PROFILES.thickness[decodedFollicleIdProfiles.thickness],
      decodedFollicleIdDisplay.thickness, // "fine strands"
      includeReasons ? allReasons : null
    ),
    damage: scoreCategoryMatch(
      productIngredients,
      totalIngredients,
      INGREDIENT_PROFILES.damage[decodedFollicleIdProfiles.damage],
      decodedFollicleIdDisplay.damage, // "some damage" or "healthy hair"
      includeReasons ? allReasons : null
    ),
  }

  // Combine category scores using weights (Lego assembly)
  const finalScore =
    categoryScores.hairType * INGREDIENT_CATEGORY_WEIGHTS.hairType +
    categoryScores.porosity * INGREDIENT_CATEGORY_WEIGHTS.porosity +
    categoryScores.density * INGREDIENT_CATEGORY_WEIGHTS.density +
    categoryScores.thickness * INGREDIENT_CATEGORY_WEIGHTS.thickness +
    categoryScores.damage * INGREDIENT_CATEGORY_WEIGHTS.damage

  // Clamp to valid range
  const clampedScore = Math.max(
    SCORING_MODIFIERS.minScore,
    Math.min(SCORING_MODIFIERS.maxScore, finalScore)
  )

  // Limit total reasons shown (most important categories appear first)
  const limitedReasons = allReasons.slice(
    0,
    MATCH_REASONS_CONFIG.maxReasonsTotal
  )

  return {
    score: clampedScore,
    reasons: limitedReasons,
  }
}

/**
 * Score a single category (hairType, porosity, etc.)
 * Checks beneficial and avoided ingredients with position awareness
 *
 * @returns Score from 0.0 to 1.0
 */
function scoreCategoryMatch(
  productIngredients: string[],
  totalIngredients: number,
  profile: { beneficial: string[]; avoid: string[] } | undefined,
  displayName: string, // Already formatted from decodeFollicleId()
  reasons: string[] | null
): number {
  // If no profile for this category value, return neutral
  if (!profile) {
    return 0.5
  }

  let score = 0.5 // Start neutral
  const foundBeneficial: Array<{ ingredient: string; position: number }> = []
  const foundAvoid: string[] = []

  // Check beneficial ingredients (position-aware)
  profile.beneficial.forEach((beneficial) => {
    const beneficialLower = beneficial.toLowerCase()
    const position = productIngredients.findIndex(
      (ing) => ing.includes(beneficialLower) || beneficialLower.includes(ing)
    )

    if (position !== -1) {
      foundBeneficial.push({ ingredient: beneficial, position })

      // Base bonus for having the ingredient
      const baseBonus = SCORING_MODIFIERS.beneficialBonus

      // Position bonus (earlier = better)
      const positionBonus = getPositionScore(position, totalIngredients)

      // Total bonus
      score += baseBonus + positionBonus
    }
  })

  // Check avoided ingredients (position doesn't matter - any amount is bad)
  profile.avoid.forEach((avoid) => {
    const avoidLower = avoid.toLowerCase()
    const found = productIngredients.some(
      (ing) => ing.includes(avoidLower) || avoidLower.includes(ing)
    )

    if (found) {
      foundAvoid.push(avoid)
      score += SCORING_MODIFIERS.avoidPenalty // Negative penalty
    }
  })

  // Add reasons if requested
  if (reasons !== null) {
    // Sort beneficial by position (best first)
    foundBeneficial.sort((a, b) => a.position - b.position)

    // Add top beneficial ingredients with display name
    if (foundBeneficial.length > 0) {
      const topIngredients = foundBeneficial
        .slice(0, MATCH_REASONS_CONFIG.maxBeneficialPerCharacteristic)
        .map((item) => item.ingredient)
        .join(', ')

      reasons.push(`Contains ${topIngredients} for ${displayName}`)
    }

    // Add warning for avoided ingredients
    const avoidedToShow = foundAvoid.slice(
      0,
      MATCH_REASONS_CONFIG.maxAvoidedPerCharacteristic
    )
    if (avoidedToShow.length > 0) {
      reasons.push(
        `⚠️ Contains ${avoidedToShow[0]} (not ideal for ${displayName})`
      )
    }
  }

  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, score))
}
