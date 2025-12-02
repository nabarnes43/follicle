/**
 * INGREDIENT PROFILES CONFIGURATION
 *
 * These profiles define which ingredients work well (or poorly)
 * for each hair characteristic.
 *
 * ALL NAMES ARE INCI (International Nomenclature of Cosmetic Ingredients)
 * These must match exactly what's in product.ingredients_normalized
 *
 * UPDATE THESE with your cosmetic scientist's guidance!
 */

export interface IngredientProfile {
  beneficial: string[] // Ingredients that work well
  avoid: string[] // Ingredients to avoid
}

/**
 * HAIR TYPE PROFILES
 * Different hair textures need different ingredients
 */
export const HAIR_TYPE_PROFILES: Record<string, IngredientProfile> = {
  straight: {
    beneficial: [
      'hydrolyzed wheat protein',
      'panthenol',
      'biotin',
      'keratin',
      'hydrolyzed collagen',
      'niacinamide',
      'caffeine',
    ],
    avoid: [
      'cocos nucifera oil', // Coconut oil
      'butyrospermum parkii butter', // Shea butter
      'cera alba', // Beeswax
      'petrolatum',
    ],
  },

  wavy: {
    beneficial: [
      'maris sal', // Sea salt
      'glycerin',
      'aloe barbadensis leaf juice',
      'hydrolyzed rice protein',
      'panthenol',
      'polyquaternium-10', // Curl enhancer
      'polyquaternium-7',
    ],
    avoid: [
      'dimethicone',
      'paraffinum liquidum', // Mineral oil
      'petrolatum',
      'cera alba', // Beeswax
    ],
  },

  curly: {
    beneficial: [
      'butyrospermum parkii butter', // Shea butter
      'cocos nucifera oil', // Coconut oil
      'argania spinosa kernel oil', // Argan oil
      'glycerin',
      'aloe barbadensis leaf juice',
      'simmondsia chinensis seed oil', // Jojoba oil
      'panthenol',
    ],
    avoid: [
      'sodium lauryl sulfate',
      'sodium laureth sulfate',
      'alcohol denat',
      'isopropyl alcohol',
    ],
  },

  coily: {
    beneficial: [
      'butyrospermum parkii butter', // Shea butter
      'ricinus communis seed oil', // Castor oil
      'cocos nucifera oil', // Coconut oil
      'simmondsia chinensis seed oil', // Jojoba oil
      'glycerin',
      'mangifera indica seed butter', // Mango butter
      'persea gratissima oil', // Avocado oil
    ],
    avoid: [
      'sodium lauryl sulfate',
      'sodium laureth sulfate',
      'alcohol denat',
      'isopropyl alcohol',
      'paraffinum liquidum', // Mineral oil
      'petrolatum',
    ],
  },

  protective: {
    beneficial: [
      'cocos nucifera oil', // Coconut oil
      'ricinus communis seed oil', // Castor oil
      'melaleuca alternifolia leaf oil', // Tea tree oil
      'mentha piperita oil', // Peppermint oil
      'argania spinosa kernel oil', // Argan oil
      'simmondsia chinensis seed oil', // Jojoba oil
    ],
    avoid: [
      'dimethicone',
      'sodium lauryl sulfate',
      'sodium laureth sulfate',
      'alcohol denat',
      'isopropyl alcohol',
    ],
  },
}

/**
 * POROSITY PROFILES
 * How hair absorbs and retains moisture
 */
export const POROSITY_PROFILES: Record<string, IngredientProfile> = {
  low: {
    beneficial: [
      'argania spinosa kernel oil', // Argan oil (light, penetrating)
      'simmondsia chinensis seed oil', // Jojoba oil
      'glycerin',
      'aloe barbadensis leaf juice',
      'panthenol',
      'sodium lactate', // Humectant
    ],
    avoid: [
      'butyrospermum parkii butter', // Shea butter
      'hydrolyzed keratin',
      'hydrolyzed wheat protein',
      'dimethicone',
      'cetyl alcohol', // Heavy fatty alcohol
      'stearyl alcohol',
    ],
  },

  medium: {
    beneficial: [
      'panthenol',
      'glycerin',
      'argania spinosa kernel oil', // Argan oil
      'cocos nucifera oil', // Coconut oil
      'aloe barbadensis leaf juice',
      'hydrolyzed silk',
    ],
    avoid: [],
  },

  high: {
    beneficial: [
      'butyrospermum parkii butter', // Shea butter
      'cocos nucifera oil', // Coconut oil
      'hydrolyzed keratin',
      'hydrolyzed wheat protein',
      'ceramide np', // Ceramides
      'ceramide ap',
      'behentrimonium methosulfate', // Conditioning agent
      'cetyl alcohol', // Emollient fatty alcohol
    ],
    avoid: [
      'alcohol denat',
      'isopropyl alcohol',
      'sodium lauryl sulfate',
      'sodium laureth sulfate',
    ],
  },
}

/**
 * DENSITY PROFILES
 * How much hair per square inch
 */
export const DENSITY_PROFILES: Record<string, IngredientProfile> = {
  low: {
    beneficial: [
      'hydrolyzed wheat protein',
      'hydrolyzed keratin',
      'biotin',
      'panthenol',
      'niacinamide',
      'caffeine',
      'polyquaternium-11', // Volumizing polymer
    ],
    avoid: [
      'butyrospermum parkii butter', // Shea butter
      'ricinus communis seed oil', // Castor oil
      'dimethicone',
      'petrolatum',
      'cera alba', // Beeswax
    ],
  },

  medium: {
    beneficial: [
      'panthenol',
      'glycerin',
      'argania spinosa kernel oil', // Argan oil
      'aloe barbadensis leaf juice',
    ],
    avoid: [],
  },

  high: {
    beneficial: [
      'butyrospermum parkii butter', // Shea butter
      'cocos nucifera oil', // Coconut oil
      'ricinus communis seed oil', // Castor oil
      'mangifera indica seed butter', // Mango butter
      'persea gratissima oil', // Avocado oil
      'cetearyl alcohol', // Emollient
    ],
    avoid: [],
  },
}

/**
 * THICKNESS PROFILES
 * Diameter of individual strands
 */
export const THICKNESS_PROFILES: Record<string, IngredientProfile> = {
  fine: {
    beneficial: [
      'hydrolyzed keratin',
      'hydrolyzed wheat protein',
      'hydrolyzed silk',
      'panthenol',
      'biotin',
      'niacinamide',
      'polyquaternium-11', // Volumizing
    ],
    avoid: [
      'butyrospermum parkii butter', // Shea butter
      'ricinus communis seed oil', // Castor oil
      'dimethicone',
      'petrolatum',
      'cetyl alcohol',
      'stearyl alcohol',
    ],
  },

  medium: {
    beneficial: [
      'panthenol',
      'glycerin',
      'argania spinosa kernel oil', // Argan oil
      'cocos nucifera oil', // Coconut oil
      'aloe barbadensis leaf juice',
      'hydrolyzed silk',
    ],
    avoid: [],
  },

  coarse: {
    beneficial: [
      'butyrospermum parkii butter', // Shea butter
      'cocos nucifera oil', // Coconut oil
      'ricinus communis seed oil', // Castor oil
      'persea gratissima oil', // Avocado oil
      'mangifera indica seed butter', // Mango butter
      'dimethicone', // Smoothing silicone
      'behentrimonium methosulfate', // Deep conditioning
    ],
    avoid: [],
  },
}

/**
 * DAMAGE PROFILES
 * Level of hair damage
 */
export const DAMAGE_PROFILES: Record<string, IngredientProfile> = {
  none: {
    beneficial: [
      'panthenol',
      'biotin',
      'tocopherol', // Vitamin E
      'ascorbic acid', // Vitamin C
      'niacinamide',
      'glycerin',
    ],
    avoid: [
      'sodium lauryl sulfate',
      'sodium laureth sulfate',
      'alcohol denat',
      'isopropyl alcohol',
    ],
  },

  some: {
    beneficial: [
      'hydrolyzed keratin',
      'hydrolyzed wheat protein',
      'panthenol',
      'ceramide np',
      'ceramide ap',
      'arginine', // Amino acid
      'behentrimonium methosulfate',
      'quaternium-80', // Bond builder
    ],
    avoid: [
      'sodium lauryl sulfate',
      'sodium laureth sulfate',
      'alcohol denat',
      'isopropyl alcohol',
    ],
  },

  severe: {
    beneficial: [
      'hydrolyzed keratin',
      'hydrolyzed wheat protein',
      'ceramide np',
      'ceramide ap',
      'ceramide eop',
      'arginine', // Amino acid
      'cysteine', // Amino acid
      'methionine', // Amino acid
      'behentrimonium methosulfate',
      'bis-aminopropyl diglycol dimaleate', // Olaplex bond builder
      'maleic acid', // Bond builder
    ],
    avoid: [
      'sodium lauryl sulfate',
      'sodium laureth sulfate',
      'sodium c14-16 olefin sulfonate',
      'alcohol denat',
      'isopropyl alcohol',
    ],
  },
}

/**
 * MASTER PROFILES OBJECT
 * Maps to HairAnalysis field names
 */
export const INGREDIENT_PROFILES = {
  hairType: HAIR_TYPE_PROFILES,
  porosity: POROSITY_PROFILES,
  density: DENSITY_PROFILES,
  thickness: THICKNESS_PROFILES,
  damage: DAMAGE_PROFILES,
} as const
