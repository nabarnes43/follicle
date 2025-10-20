// lib/analysis/questions.ts
import { AnalysisQuestion } from '@/types/analysis'

export const ANALYSIS_QUESTIONS: AnalysisQuestion[] = [
  // === POROSITY & MOISTURE ===
  {
    id: 'dryTime',
    type: 'radio',
    question: 'How long does your hair take to air dry completely?',
    required: true,
    options: [
      { value: 'low', label: '4+ hours', description: 'Low porosity' },
      { value: 'medium', label: '2-3 hours', description: 'Medium porosity' },
      { value: 'high', label: '1-2 hours', description: 'High porosity' },
    ],
  },
  {
    id: 'waterAbsorption',
    type: 'radio',
    question: 'When you wet your hair, how quickly does it absorb water?',
    options: [
      { value: 'beads', label: 'Water beads up on the surface' },
      { value: 'slow', label: 'Takes a while to get fully saturated' },
      { value: 'quick', label: 'Absorbs water quickly' },
      { value: 'instant', label: 'Immediately soaks up water like a sponge' },
    ],
  },
  {
    id: 'productAbsorption',
    type: 'radio',
    question: 'How does your hair react to products?',
    options: [
      { value: 'sits', label: 'Products sit on top and feel heavy' },
      { value: 'absorbs', label: 'Products absorb well' },
      { value: 'disappears', label: 'Products seem to disappear quickly' },
    ],
  },

  // === HAIR CHARACTERISTICS ===
  {
    id: 'length',
    type: 'select',
    question: "What's your approximate hair length?",
    options: [
      { value: 'chin', label: 'Chin length or shorter' },
      { value: 'shoulder', label: 'Shoulder length' },
      { value: 'midBack', label: 'Mid-back length' },
      { value: 'waist', label: 'Waist length or longer' },
    ],
  },
  {
    id: 'texture',
    type: 'radio',
    question: 'What is your hair texture/curl pattern?',
    options: [
      { value: '1a', label: '1A - Straight, no curl' },
      { value: '1b', label: '1B - Straight with slight body wave' },
      { value: '1c', label: '1C - Straight with body wave and bends' },
      { value: '2a', label: '2A - Wavy, fine, thin' },
      { value: '2b', label: '2B - Wavy, medium S-pattern' },
      { value: '2c', label: '2C - Wavy, thick S-pattern' },
      { value: '3a', label: '3A - Loose curls' },
      { value: '3b', label: '3B - Springy ringlets' },
      { value: '3c', label: '3C - Tight corkscrews' },
      { value: '4a', label: '4A - Soft coils' },
      { value: '4b', label: '4B - Z-pattern coils' },
      { value: '4c', label: '4C - Tightly kinked' },
    ],
  },
  {
    id: 'density',
    type: 'radio',
    question: 'What is your hair density? (How much hair you have)',
    options: [
      { value: 'low', label: 'Low - Can see scalp easily' },
      { value: 'medium', label: 'Medium - Some scalp visibility' },
      { value: 'high', label: 'High - Difficult to see scalp' },
    ],
  },
  {
    id: 'thickness',
    type: 'radio',
    question: 'What is your hair strand thickness?',
    options: [
      {
        value: 'fine',
        label: 'Fine - Individual strands are thin, hard to feel',
      },
      { value: 'medium', label: 'Medium - Can feel individual strands' },
      {
        value: 'coarse',
        label: 'Coarse - Thick, easy to feel individual strands',
      },
    ],
  },

  // === SCALP & HEALTH ===
  {
    id: 'scalpType',
    type: 'radio',
    question: 'What is your scalp type?',
    options: [
      { value: 'dry', label: 'Dry - Itchy, flaky' },
      { value: 'balanced', label: 'Balanced - No issues' },
      { value: 'oily', label: 'Oil-Prone - Gets greasy quickly' },
    ],
  },
  {
    id: 'dandruff',
    type: 'radio',
    question: 'Do you experience dandruff or scalp flaking?',
    options: [
      { value: 'none', label: 'No dandruff' },
      { value: 'mild', label: 'Occasional light flaking' },
      { value: 'moderate', label: 'Regular flaking' },
      { value: 'severe', label: 'Severe flaking/scaling' },
    ],
  },
  {
    id: 'scalpSensitivity',
    type: 'radio',
    question: 'How sensitive is your scalp?',
    options: [
      { value: 'not', label: 'Not sensitive' },
      { value: 'somewhat', label: 'Somewhat sensitive to certain products' },
      { value: 'very', label: 'Very sensitive - reactions to many products' },
    ],
  },

  // === MOISTURE & PROTEIN BALANCE ===
  {
    id: 'hairFeel',
    type: 'radio',
    question: 'How does your hair typically feel?',
    options: [
      { value: 'dry', label: 'Dry and brittle' },
      { value: 'soft', label: 'Soft and balanced' },
      { value: 'mushy', label: 'Mushy or overly soft when wet' },
      { value: 'straw', label: 'Straw-like and rough' },
    ],
  },
  {
    id: 'elasticity',
    type: 'radio',
    question: 'When you gently stretch a wet strand, what happens?',
    options: [
      { value: 'stretches', label: 'Stretches and bounces back' },
      { value: 'stretchesBreaks', label: 'Stretches a lot then breaks' },
      { value: 'breaksQuickly', label: 'Breaks quickly with little stretch' },
    ],
  },
  {
    id: 'frizz',
    type: 'radio',
    question: 'How frizzy is your hair?',
    options: [
      { value: 'none', label: 'Not frizzy' },
      { value: 'mild', label: 'Slightly frizzy in humidity' },
      { value: 'moderate', label: 'Moderately frizzy' },
      { value: 'severe', label: 'Very frizzy and unmanageable' },
    ],
  },

  // === DAMAGE & TREATMENTS ===
  {
    id: 'chemicalTreatment',
    type: 'multiselect',
    question: 'What chemical treatments have you had? (Select all that apply)',
    options: [
      { value: 'none', label: 'None' },
      { value: 'color', label: 'Hair color/dye' },
      { value: 'bleach', label: 'Bleach/highlights' },
      { value: 'relaxer', label: 'Relaxer' },
      { value: 'perm', label: 'Perm' },
      { value: 'keratin', label: 'Keratin treatment' },
    ],
  },
  {
    id: 'heatUsage',
    type: 'radio',
    question: 'How often do you use heat styling tools?',
    options: [
      { value: 'never', label: 'Never' },
      { value: 'rarely', label: 'Rarely (few times a year)' },
      { value: 'sometimes', label: 'Sometimes (monthly)' },
      { value: 'often', label: 'Often (weekly)' },
      { value: 'daily', label: 'Daily' },
    ],
  },
  {
    id: 'damageLevel',
    type: 'radio',
    question: 'What is your overall damage level?',
    options: [
      { value: 'none', label: 'Healthy - No damage' },
      { value: 'mild', label: 'Mild - Some split ends' },
      { value: 'moderate', label: 'Moderate - Noticeable breakage' },
      { value: 'severe', label: 'Severe - Significant damage/breakage' },
    ],
  },

  // === STYLING & PREFERENCES ===
  {
    id: 'washFrequency',
    type: 'select',
    question: 'How often do you wash your hair?',
    options: [
      { value: 'daily', label: 'Daily' },
      { value: 'every2', label: 'Every 2-3 days' },
      { value: 'weekly', label: 'Once a week' },
      { value: 'biweekly', label: 'Every 2 weeks' },
      { value: 'monthly', label: 'Monthly or less' },
    ],
  },
  {
    id: 'stylingGoals',
    type: 'multiselect',
    question: 'What are your main styling goals? (Select all that apply)',
    options: [
      { value: 'definition', label: 'Curl/wave definition' },
      { value: 'volume', label: 'Volume and body' },
      { value: 'shine', label: 'Shine and luster' },
      { value: 'frizz', label: 'Frizz control' },
      { value: 'moisture', label: 'Moisture and hydration' },
      { value: 'growth', label: 'Hair growth' },
      { value: 'strength', label: 'Strength and repair' },
    ],
  },
  {
    id: 'productPreference',
    type: 'radio',
    question: 'What product weight do you prefer?',
    options: [
      { value: 'light', label: 'Light - Weightless feel' },
      { value: 'medium', label: 'Medium - Some hold' },
      { value: 'heavy', label: 'Heavy - Maximum moisture and hold' },
    ],
  },

  // === BUDGET & LIFESTYLE ===
  {
    id: 'budget',
    type: 'slider',
    question: 'What is your monthly hair care budget?',
    min: 0,
    max: 200,
    step: 10,
    unit: '$',
  },
  {
    id: 'timeCommitment',
    type: 'radio',
    question: 'How much time can you dedicate to your hair routine?',
    options: [
      { value: 'minimal', label: 'Minimal - 5-10 minutes' },
      { value: 'moderate', label: 'Moderate - 15-30 minutes' },
      { value: 'dedicated', label: 'Dedicated - 30-60 minutes' },
      { value: 'extensive', label: 'Extensive - 1+ hours' },
    ],
  },

  // === INGREDIENT PREFERENCES ===
  {
    id: 'ingredientAvoid',
    type: 'multiselect',
    question: 'Which ingredients do you want to avoid? (Select all that apply)',
    options: [
      { value: 'none', label: 'No restrictions' },
      { value: 'sulfates', label: 'Sulfates' },
      { value: 'silicones', label: 'Silicones' },
      { value: 'parabens', label: 'Parabens' },
      { value: 'fragrance', label: 'Fragrance' },
      { value: 'alcohol', label: 'Drying alcohols' },
      { value: 'protein', label: 'Protein' },
    ],
  },
  {
    id: 'naturalPreference',
    type: 'radio',
    question: 'How important are natural/organic ingredients to you?',
    options: [
      { value: 'not', label: 'Not important' },
      { value: 'somewhat', label: 'Somewhat important' },
      { value: 'very', label: 'Very important' },
      { value: 'only', label: 'Only natural/organic products' },
    ],
  },

  // === ENVIRONMENTAL FACTORS ===
  {
    id: 'climate',
    type: 'radio',
    question: 'What climate do you live in?',
    options: [
      { value: 'dry', label: 'Dry/arid' },
      { value: 'humid', label: 'Humid' },
      { value: 'cold', label: 'Cold/dry winters' },
      { value: 'moderate', label: 'Moderate/temperate' },
    ],
  },
  {
    id: 'waterHardness',
    type: 'radio',
    question: 'What type of water do you have?',
    options: [
      { value: 'soft', label: 'Soft water' },
      { value: 'hard', label: 'Hard water' },
      { value: 'unknown', label: "I don't know" },
    ],
  },

  // === SPECIFIC CONCERNS ===
  {
    id: 'hairGoals',
    type: 'multiselect',
    question: 'What are your top hair concerns? (Select up to 3)',
    options: [
      { value: 'dryness', label: 'Dryness' },
      { value: 'breakage', label: 'Breakage' },
      { value: 'thinning', label: 'Thinning/hair loss' },
      { value: 'split', label: 'Split ends' },
      { value: 'dullness', label: 'Dullness/lack of shine' },
      { value: 'tangles', label: 'Tangles/knots' },
      { value: 'flat', label: 'Flatness/lack of volume' },
      { value: 'undefined', label: 'Undefined curls/waves' },
    ],
  },
  {
    id: 'sleepProtection',
    type: 'multiselect',
    question: 'How do you protect your hair at night? (Select all that apply)',
    options: [
      { value: 'none', label: 'No protection' },
      { value: 'satin', label: 'Satin/silk pillowcase' },
      { value: 'bonnet', label: 'Bonnet' },
      { value: 'scarf', label: 'Scarf' },
      { value: 'pineapple', label: 'Pineapple/protective style' },
    ],
  },

  // === STYLING TECHNIQUES ===
  {
    id: 'stylingMethods',
    type: 'multiselect',
    question:
      'Which styling methods do you currently use? (Select all that apply)',
    options: [
      { value: 'airDry', label: 'Air dry' },
      { value: 'diffuse', label: 'Diffuser' },
      { value: 'blowDry', label: 'Blow dry' },
      { value: 'plopping', label: 'Plopping/microplopping' },
      { value: 'twists', label: 'Twists/braids' },
      { value: 'fingerCoils', label: 'Finger coils' },
      { value: 'shingling', label: 'Shingling' },
    ],
  },
  {
    id: 'productLayering',
    type: 'radio',
    question: 'How many products do you typically layer?',
    options: [
      { value: '1', label: '1 product' },
      { value: '2-3', label: '2-3 products' },
      { value: '4-5', label: '4-5 products' },
      { value: '6+', label: '6+ products' },
    ],
  },

  // === WASH DAY ROUTINE ===
  {
    id: 'shampooType',
    type: 'radio',
    question: 'What type of shampoo do you use?',
    options: [
      { value: 'none', label: 'No shampoo (co-wash only)' },
      { value: 'clarifying', label: 'Clarifying shampoo' },
      { value: 'regular', label: 'Regular shampoo' },
      { value: 'lowPoo', label: 'Low-poo (sulfate-free)' },
      { value: 'both', label: 'Alternate between types' },
    ],
  },
  {
    id: 'conditionerUsage',
    type: 'radio',
    question: 'How do you use conditioner?',
    options: [
      { value: 'rinse', label: 'Rinse-out only' },
      { value: 'leave', label: 'Leave-in only' },
      { value: 'both', label: 'Both rinse-out and leave-in' },
      { value: 'deep', label: 'Deep conditioning treatments regularly' },
    ],
  },

  // === PRODUCT PERFORMANCE ===
  {
    id: 'proteinReaction',
    type: 'radio',
    question: 'How does your hair react to protein-rich products?',
    options: [
      { value: 'loves', label: 'Loves it - feels stronger' },
      { value: 'neutral', label: 'No noticeable difference' },
      { value: 'dislikes', label: 'Gets stiff/brittle' },
      { value: 'unknown', label: "I don't know" },
    ],
  },
  {
    id: 'oilResponse',
    type: 'radio',
    question: 'How does your hair respond to oils?',
    options: [
      { value: 'absorbs', label: 'Absorbs well, adds shine' },
      { value: 'sits', label: 'Sits on top, feels greasy' },
      { value: 'mixed', label: 'Depends on the oil' },
      { value: 'unknown', label: "Haven't tried oils" },
    ],
  },

  // === FINAL DETAILS ===
  {
    id: 'greyHair',
    type: 'radio',
    question: 'Do you have grey/silver hair?',
    options: [
      { value: 'none', label: 'No grey hair' },
      { value: 'some', label: 'Some grey strands' },
      { value: 'mostly', label: 'Mostly grey/silver' },
      { value: 'fully', label: 'Fully grey/silver' },
    ],
  },
  {
    id: 'previousSuccess',
    type: 'radio',
    question: 'Have you found products that work well for you before?',
    options: [
      { value: 'yes', label: 'Yes, I have favorites' },
      { value: 'some', label: 'Some products work okay' },
      { value: 'no', label: 'Still searching' },
    ],
  },
]
