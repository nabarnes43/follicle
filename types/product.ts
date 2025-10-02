export interface Product {
    id: string
    brand: string
    name: string
    category: string
    price: number
    imageUrl: string
    
    // Ingredient data
    ingredients: string[] // Raw ingredient names as listed
    ingredientsNormalized: string[] // Uppercase normalized names
    ingredientRefs: (string | null)[] // References to Ingredient docs (null if unmapped)
    ingredientCount: number
    unmappedIngredients: string[] // Ingredients not yet in database
    
    // User engagement by hair type
    engagementStats: ProductEngagementStats
    
    // Metadata
    rating: number | null
    reviewCount: number
    createdAt: Date
    updatedAt: Date
    dataSource: string // e.g., "skinsort_migration", "manual_entry"
    
    // Optional fields
    description?: string
    affiliateUrl?: string
  }
  
  export interface ProductEngagementStats {
    straight: HairTypeEngagement
    wavy: HairTypeEngagement
    curly: HairTypeEngagement
    coily: HairTypeEngagement
    protective: HairTypeEngagement
    lastUpdated: Date
  }
  
  export interface HairTypeEngagement {
    likes: number
    dislikes: number
    rerolls: number // How many times users skipped this product
    routines: number // How many routines include this product
    views: number
  }
  
  //This is really for the future and because it is already a field in the database
  export interface ProductReview {
    id: string
    productId: string
    userId: string
    follicleId: string
    rating: number // 1-5
    review: string
    helpful: number
    createdAt: Date
  }