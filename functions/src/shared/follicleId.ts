// functions/src/shared/follicleId.ts
import { HairAnalysis } from '../types/user'

/**
 * Generate a follicle ID from hair analysis
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
 * Decode follicle ID to HairAnalysis object for scoring
 * Use this when you need the actual values for matching algorithms
 *
 * @example
 * decodeFollicleIdToAnalysis('CU-H-M-F-N')
 * // → { hairType: 'curly', porosity: 'high', density: 'medium', thickness: 'fine', damage: 'none' }
 */
export function decodeFollicleIdToAnalysis(
  follicleId: string
): HairAnalysis | null {
  const parts = follicleId.split('-')

  if (parts.length !== 5) {
    console.warn('Invalid follicle ID format:', follicleId)
    return null
  }

  const textureMap: Record<string, HairAnalysis['hairType']> = {
    ST: 'straight',
    WV: 'wavy',
    CU: 'curly',
    CO: 'coily',
    PR: 'protective',
  }

  const porosityMap: Record<string, HairAnalysis['porosity']> = {
    L: 'low',
    M: 'medium',
    H: 'high',
  }

  const densityMap: Record<string, HairAnalysis['density']> = {
    L: 'low',
    M: 'medium',
    H: 'high',
  }

  const thicknessMap: Record<string, HairAnalysis['thickness']> = {
    F: 'fine',
    M: 'medium',
    C: 'coarse',
  }

  const damageMap: Record<string, HairAnalysis['damage']> = {
    N: 'none',
    S: 'some',
    V: 'severe',
  }

  const hairType = textureMap[parts[0]]
  const porosity = porosityMap[parts[1]]
  const density = densityMap[parts[2]]
  const thickness = thicknessMap[parts[3]]
  const damage = damageMap[parts[4]]

  // Validate all parts decoded successfully
  if (!hairType || !porosity || !density || !thickness || !damage) {
    console.warn('Invalid follicle ID values:', follicleId)
    return null
  }

  return {
    hairType,
    porosity,
    density,
    thickness,
    damage,
  }
}

/**
 * Decode follicle ID to human-readable strings for UI display
 * Use this for showing users their hair profile in a friendly format
 *
 * @example
 * decodeFollicleIdForDisplay('CU-H-M-F-N')
 * // → { hairType: 'curly hair', porosity: 'high porosity', ... }
 */
export function decodeFollicleIdForDisplay(follicleId: string): {
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
