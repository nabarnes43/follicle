import { type ProductCategory } from '@/lib/matching/products/config/categories'

/**
 * STEP CATEGORY WEIGHTS
 *
 * Defines the importance of different product categories in routines
 * Core cleansing/conditioning steps matter most for hair health
 * Styling products matter less (personal preference)
 */
export const STEP_CATEGORY_WEIGHTS: Record<ProductCategory, number> = {
  // Core cleansing (highest priority)
  'Shampoos': 1.0,
 'Conditioners': 1.0,

  // Deep treatments
  'Hair Masks': 0.95,
  'Leave-in Treatments': 0.9,
  'Scalp Treatments': 0.9,

  // Maintenance products
  'Leave-in Conditioners': 0.85,
  'Hair Oils': 0.8,
  'Hair Serums': 0.8,
  'Detanglers': 0.75,

  // Styling products
  'Styling Creams & Sprays': 0.7,
  'Gel, Pomade & Wax': 0.7,
  'Mousse & Foam': 0.65,
  'Hair Sprays': 0.6,
  'Heat Protectants': 0.65,

  // Specialty/occasional use
  'Dry Shampoos': 0.6,
  'Scalp Scrubs': 0.7,
  'Styling Tools': 0.5,

  // Catchalls
  'Other Hair Cleansers': 0.8,
  'Hair Loss': 0.85,
  'Other Haircare': 0.7,
  'Other Styling': 0.6,
}

/**
 * Get weight for a product category
 *
 * @param category - Product category
 * @returns Weight from 0.5 to 1.0
 */
export function getStepCategoryWeight(category: ProductCategory): number {
  return STEP_CATEGORY_WEIGHTS[category]
}
