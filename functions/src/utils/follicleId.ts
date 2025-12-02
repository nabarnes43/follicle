// functions/src/utils/follicleId.ts
import { HairAnalysis } from '../types/user'

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
