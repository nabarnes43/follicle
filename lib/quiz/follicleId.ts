import { HairAnalysis } from '@/types/user'

/**
 * Generates follicleId from HairAnalysis
 * Format: [HAIRTYPE]-[POROSITY]-[DENSITY]-[THICKNESS]-[DAMAGE]
 * Example: CU-H-M-F-N (Curly, High Porosity, Medium Density, Fine, No Damage)
 *
 * Uses 1 letter when possible, 2 letters only to avoid conflicts
 */
export function generateFollicleId(hairAnalysis: HairAnalysis): string {
  const textureMap: Record<string, string> = {
    straight: 'ST',
    wavy: 'WV',
    curly: 'CU',
    coily: 'CO',
    protective: 'PR',
  }

  const porosityMap: Record<string, string> = {
    low: 'L',
    medium: 'M',
    high: 'H',
  }

  const densityMap: Record<string, string> = {
    low: 'L',
    medium: 'M',
    high: 'H',
  }

  const thicknessMap: Record<string, string> = {
    fine: 'F',
    medium: 'M',
    coarse: 'C',
  }

  const damageMap: Record<string, string> = {
    none: 'N',
    some: 'S',
    severe: 'V',
  }

  const parts = [
    textureMap[hairAnalysis.hairType] || 'CU',
    porosityMap[hairAnalysis.porosity] || 'M',
    densityMap[hairAnalysis.density] || 'M',
    thicknessMap[hairAnalysis.thickness] || 'M',
    damageMap[hairAnalysis.damage] || 'N',
  ]

  return parts.join('-')
}

/**
 * Decode a follicle ID back into display-ready components
 * Example: 'CU-H-M-F-N' → { hairType: 'curly hair', porosity: 'high porosity', ... }
 *
 * Returns display-ready strings for use in UI and match reasons
 */
export function decodeFollicleId(follicleId: string): {
  hairType: string
  porosity: string
  density: string
  thickness: string
  damage: string
} | null {
  const parts = follicleId.split('-')

  if (parts.length !== 5) {
    console.warn('Invalid follicle ID format:', follicleId)
    return null
  }

  const textureMap: Record<string, string> = {
    ST: 'straight hair',
    WV: 'wavy hair',
    CU: 'curly hair',
    CO: 'coily hair',
    PR: 'protective styles',
  }

  const porosityMap: Record<string, string> = {
    L: 'low porosity',
    M: 'medium porosity',
    H: 'high porosity',
  }

  const densityMap: Record<string, string> = {
    L: 'low density',
    M: 'medium density',
    H: 'high density',
  }

  const thicknessMap: Record<string, string> = {
    F: 'fine strands',
    M: 'medium strands',
    C: 'coarse strands',
  }

  const damageMap: Record<string, string> = {
    N: 'healthy hair',
    S: 'some damage',
    V: 'severe damage',
  }

  return {
    hairType: textureMap[parts[0]] || 'curly hair',
    porosity: porosityMap[parts[1]] || 'medium porosity',
    density: densityMap[parts[2]] || 'medium density',
    thickness: thicknessMap[parts[3]] || 'medium strands',
    damage: damageMap[parts[4]] || 'healthy hair',
  }
}

/**
 * Convert quiz answers directly to HairAnalysis
 */
export function answersToHairAnalysis(
  answers: Record<string, any>
): HairAnalysis {
  return {
    // Required fields - used for follicleId
    hairType: answers.hairType,
    porosity: answers.porosity,
    density: answers.density,
    thickness: answers.thickness,
    damage: answers.damage,

    // Optional fields
    length: answers.length,
    scalpType: answers.scalpType,
    mainGoal: answers.mainGoal,
    budget: answers.budget,
    washFrequency: answers.washFrequency,
  }
}

/**
 * Get human-readable description for display
 * Uses bullet points to separate characteristics
 */
export function getFollicleIdDescription(follicleId: string): string {
  const decoded = decodeFollicleId(follicleId)

  if (!decoded) {
    return 'Invalid follicle ID'
  }

  return [
    decoded.hairType,
    decoded.porosity,
    decoded.density,
    decoded.thickness,
    decoded.damage,
  ]
    .filter(Boolean)
    .join(' • ')
}
