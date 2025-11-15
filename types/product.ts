import { ProductCategory } from '@/lib/matching/products/config/categories'

export interface Product {
  id: string
  brand: string
  name: string
  category: ProductCategory
  price: number
  image_url: string

  // Ingredient data
  ingredients: string[] // Raw ingredient names as listed
  ingredients_normalized: string[] // Uppercase normalized names
  ingredient_refs: (string | null)[] // References to Ingredient docs (null if unmapped)
  ingredient_count: number
  unmapped_ingredients: string[] // Ingredients not yet in database

  // User engagement by hair type
  //engagement_stats: ProductEngagementStats

  // Metadata
  rating: number | null
  review_count: number
  created_at: Date
  updated_at: Date
  data_source: string // e.g., "skinsort_migration", "manual_entry"

  // Optional fields
  description?: string
  affiliate_url?: string
}

//This is really for the future and because it is already a field in the database
export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  follicle_id: string
  rating: number // 1-5
  review: string
  helpful: number
  created_at: Date
}
