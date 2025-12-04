import { ProductCategory } from '../../products/config/categories'

/**
 * Step category weights - importance of each product type in routines
 */
export const STEP_CATEGORY_WEIGHTS: Record<ProductCategory, number> = {
  Shampoos: 1.0,
  Conditioners: 1.0,
  'Hair Masks': 0.95,
  'Leave-in Treatments': 0.9,
  'Scalp Treatments': 0.9,
  'Leave-in Conditioners': 0.85,
  'Hair Oils': 0.8,
  'Hair Serums': 0.8,
  Detanglers: 0.75,
  'Styling Creams & Sprays': 0.7,
  'Gel, Pomade & Wax': 0.7,
  'Mousse & Foam': 0.65,
  'Hair Sprays': 0.6,
  'Heat Protectants': 0.65,
  'Dry Shampoos': 0.6,
  'Scalp Scrubs': 0.7,
  'Styling Tools': 0.5,
  'Other Hair Cleansers': 0.8,
  'Hair Loss': 0.85,
  'Other Haircare': 0.7,
  'Other Styling': 0.6,
}

export function getStepCategoryWeight(category: string): number {
  return STEP_CATEGORY_WEIGHTS[category as ProductCategory] ?? 0.5
}
