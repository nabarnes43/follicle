/**
 * Available techniques for routine steps
 */
export const TECHNIQUES = [
  'Prayer Hands',
  'Rake',
  'Finger Curl',
  'Pulse',
  'Shingling',
  'Scrunch',
  'Finger Coil',
  'Finger Twists',
] as const

export type Technique = (typeof TECHNIQUES)[number]


/**
 * Available amounts for products
 */
export const AMOUNTS = [
  'Coin sized',
  'Nickel sized',
  'Dime sized',
  'Quarter sized',
] as const

export type Amount = (typeof AMOUNTS)[number]
