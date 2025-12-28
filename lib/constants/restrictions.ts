/**
 * EU Cosmetic Regulation Annexes for ingredient restrictions
 * Based on Regulation (EC) No 1223/2009
 */

export interface RestrictionInfo {
  displayText: string
  description: string
  severity: 'info' | 'warning' | 'prohibited'
}

/**
 * Extract annex information from restriction string and provide user-friendly explanation
 */
export function getRestrictionInfo(
  restriction: string | null | undefined
): RestrictionInfo | null {
  if (!restriction || restriction.toLowerCase() === 'none') {
    return null
  }

  const restrictionLower = restriction.toLowerCase()

  // Annex II = Prohibited substances
  if (
    restrictionLower.includes('annex ii') ||
    (restrictionLower.includes('entry') &&
      restrictionLower.includes('annex ii'))
  ) {
    return {
      displayText: 'Annex II',
      description: 'Prohibited in cosmetics',
      severity: 'prohibited',
    }
  }

  // Annex III = Restricted substances
  if (
    restrictionLower.includes('annex iii') ||
    restrictionLower.includes('iii/')
  ) {
    return {
      displayText: 'Annex III',
      description: 'Restricted use - permitted under specific conditions',
      severity: 'warning',
    }
  }

  // Annex IV = Colorants
  if (
    restrictionLower.includes('annex iv') ||
    restrictionLower.includes('iv/')
  ) {
    return {
      displayText: 'Annex IV',
      description: 'Colorant - allowed with restrictions',
      severity: 'info',
    }
  }

  // Annex V = Preservatives
  if (
    restrictionLower.includes('annex v') ||
    restrictionLower.startsWith('v/')
  ) {
    return {
      displayText: 'Annex V',
      description: 'Preservative - allowed with restrictions',
      severity: 'info',
    }
  }

  // Annex VI = UV Filters
  if (
    restrictionLower.includes('annex vi') ||
    restrictionLower.startsWith('vi/')
  ) {
    return {
      displayText: 'Annex VI',
      description: 'UV filter - allowed with restrictions',
      severity: 'info',
    }
  }

  // Fallback for any other restriction
  return {
    displayText: 'Regulatory Restriction',
    description: 'This ingredient has regulatory restrictions',
    severity: 'info',
  }
}

/**
 * Get the full restriction text, cleaned up for display
 * Removes redundant "entry XXXX of" prefixes but keeps meaningful info
 */
export function getFullRestrictionText(
  restriction: string | null | undefined
): string | null {
  if (!restriction || restriction.toLowerCase() === 'none') {
    return null
  }

  // For entry-based restrictions, extract the bracketed description if it exists
  const bracketMatch = restriction.match(/\[(.*?)\]/)
  if (bracketMatch) {
    return bracketMatch[1]
  }

  // For simple annex references (V/2, VI/10), just return as-is
  if (/^(V|VI|III|IV|II)\/\d+$/.test(restriction.trim())) {
    return restriction
  }

  // Otherwise return the full text
  return restriction
}
