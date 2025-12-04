// functions/src/config/categories.ts
export const PRODUCT_CATEGORIES = [
  'Shampoos',
  'Conditioners',
  'Hair Masks',
  'Styling Creams & Sprays',
  'Hair Oils',
  'Leave-in Conditioners',
  'Hair Serums',
  'Gel, Pomade & Wax',
  'Leave-in Treatments',
  'Scalp Treatments',
  'Styling Tools',
  'Hair Sprays',
  'Dry Shampoos',
  'Mousse & Foam',
  'Heat Protectants',
  'Scalp Scrubs',
  'Detanglers',
  'Other Hair Cleansers',
  'Hair Loss',
  'Other Haircare',
  'Other Styling',
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]
