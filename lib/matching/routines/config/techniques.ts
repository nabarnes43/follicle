/**
 * Hair styling and care techniques
 * Used in routine creation as optional application methods
 */
export const HAIR_TECHNIQUES = [
  // Drying
  'Air Dry',
  'Diffuse',
  'Blow Dry',

  // Application
  'Scrunch',
  'Rake',
  'Prayer Hands',
  'Squish to Condish',
  'Finger Coil',

  // Setting
  'Plop',
  'Twist Out',
  'Braid Out',

  // Protective
  'Pineapple',
  'Bonnet/Silk Cap',

  // Refresh
  'Water Refresh',

  // Scalp
  'Scalp Massage',
] as const

export type HairTechnique = (typeof HAIR_TECHNIQUES)[number]
