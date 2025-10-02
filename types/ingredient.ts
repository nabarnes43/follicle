export interface Ingredient {
    // Official ingredient identifiers
    cosingRefNo: string
    inciName: string // International nomenclature (e.g., "Aqua")
    innName: string // Common name (e.g., "Water")
    phEurName: string // European Pharmacopoeia name
    casNo: string // Chemical Abstracts Service number
    ecNo: string // European Community number
    
    // Chemical information
    chemIupacDescription: string
    restriction: string // e.g., "None", "Max 5%", etc.
    functionType: string // e.g., "Solvent", "Emollient", "Surfactant"
    
    // User preference data by hair type
    preferences: IngredientPreferences
    
    // Metadata
    updateDate: string // Date from official database
    createdAt: Date
    updatedAt: Date
  }
  
  export interface IngredientPreferences {
    straight: HairTypePreference
    wavy: HairTypePreference
    curly: HairTypePreference
    coily: HairTypePreference
    protective: HairTypePreference
  }
  
  export interface HairTypePreference {
    likes: number
    dislikes: number
  }