// lib/quiz/follicleId.ts
import { HairAnalysis } from '@/types/user'

/**
 * Generates follicleId from HairAnalysis
 * Format: [TEXTURE]-[POROSITY]-[DENSITY]-[THICKNESS]-[DAMAGE]
 * Example: 3B-M-H-C-S
 */
export function generateFollicleId(hairAnalysis: HairAnalysis): string {
  const textureMap: Record<string, string> = {
    straight: '1',
    wavy: '2',
    curly: '3',
    coily: '4',
    protective: 'P',
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
    textureMap[hairAnalysis.hairType] || '3',
    porosityMap[hairAnalysis.porosity] || 'M',
    densityMap[hairAnalysis.density] || 'M',
    thicknessMap[hairAnalysis.thickness] || 'M',
    damageMap[hairAnalysis.damage] || 'N',
  ]

  return parts.join('-')
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
 * Get human-readable description
 */
export function getFollicleIdDescription(follicleId: string): string {
  const parts = follicleId.split('-')

  const textureDesc: Record<string, string> = {
    '1': 'Straight',
    '2': 'Wavy',
    '3': 'Curly',
    '4': 'Coily',
    P: 'Protective',
  }

  const porosityDesc: Record<string, string> = {
    L: 'Low porosity',
    M: 'Medium porosity',
    H: 'High porosity',
  }

  const densityDesc: Record<string, string> = {
    L: 'Low density',
    M: 'Medium density',
    H: 'High density',
  }

  const thicknessDesc: Record<string, string> = {
    F: 'Fine strands',
    M: 'Medium strands',
    C: 'Coarse strands',
  }

  const damageDesc: Record<string, string> = {
    N: 'No damage',
    S: 'Some damage',
    V: 'Severe damage',
  }

  return [
    textureDesc[parts[0]],
    porosityDesc[parts[1]],
    densityDesc[parts[2]],
    thicknessDesc[parts[3]],
    damageDesc[parts[4]],
  ]
    .filter(Boolean)
    .join(' • ')
}
