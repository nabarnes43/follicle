// Ingredient profiles for each hair type (using INCI names)
// TODO: Expand with cosmetic chemist input
export const HAIR_TYPE_INGREDIENTS = {
  straight: {
    beneficial: ['panthenol', 'biotin', 'keratin', 'hydrolyzed collagen'],
    avoid: [
      'cocos nucifera oil', // Coconut oil (can weigh down)
      'butyrospermum parkii butter', // Shea butter (too heavy)
    ],
  },
  wavy: {
    beneficial: [
      'maris sal', // Sea salt
      'glycerin',
      'aloe barbadensis leaf juice',
      'hydrolyzed rice protein',
    ],
    avoid: [
      'dimethicone', // Heavy silicone
      'paraffinum liquidum', // Mineral oil
    ],
  },
  curly: {
    beneficial: [
      'butyrospermum parkii butter', // Shea butter
      'cocos nucifera oil', // Coconut oil
      'argania spinosa kernel oil', // Argan oil
      'glycerin',
      'aloe barbadensis leaf juice',
    ],
    avoid: [
      'sodium lauryl sulfate', // Harsh sulfate
      'sodium laureth sulfate',
      'alcohol denat', // Drying alcohol
    ],
  },
  coily: {
    beneficial: [
      'butyrospermum parkii butter', // Shea butter
      'ricinus communis seed oil', // Castor oil
      'cocos nucifera oil', // Coconut oil
      'simmondsia chinensis seed oil', // Jojoba oil
      'glycerin',
    ],
    avoid: [
      'sodium lauryl sulfate',
      'sodium laureth sulfate',
      'alcohol denat',
      'paraffinum liquidum', // Mineral oil
    ],
  },
  protective: {
    beneficial: [
      'cocos nucifera oil', // Coconut oil
      'ricinus communis seed oil', // Jamaican black castor oil (same INCI)
      'melaleuca alternifolia leaf oil', // Tea tree oil
      'mentha piperita oil', // Peppermint oil
    ],
    avoid: [
      'dimethicone', // Heavy silicone
      'sodium lauryl sulfate',
      'sodium laureth sulfate',
    ],
  },
} as const
