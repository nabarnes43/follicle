export interface Ingredient {
  id: string // Document ID

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

  // Product relationship
  product_count: number // Number of products containing this ingredient

  // Metadata
  updateDate: string // Date from official database
  createdAt: string
  updatedAt: string // Date of last change in local database
}
