import { ProductCategory } from '../products/config/categories'

export interface Product {
  id: string
  brand: string
  name: string
  category: ProductCategory
  price: number
  image_url: string
  ingredients: string[]
  ingredients_normalized: string[]
  ingredient_refs: (string | null)[]
  ingredient_count: number
  unmapped_ingredients: string[]
  rating: number | null
  review_count: number
  created_at: Date
  updated_at: Date
  data_source: string
  description?: string
  affiliate_url?: string
}

export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  follicle_id: string
  rating: number
  review: string
  helpful: number
  created_at: Date
}
