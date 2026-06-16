// Mock AI responses for the food scan / voice / barcode flows. These stand in
// for Gemini 3.5 Flash output until the backend is wired. Confidence < 0.75 on
// an item triggers the uncertainty prompt flow (the accuracy moat).

export type DetectedItem = {
  id: string;
  name: string;
  quantityG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
};

export const CONFIDENCE_THRESHOLD = 0.75;

// Photo scan result: a stir-fry where the oil quantity is uncertain.
export const aiDetectedItems: DetectedItem[] = [
  { id: 'd1', name: 'Chicken stir-fry', quantityG: 300, calories: 420, protein: 34, carbs: 30, fat: 18, confidence: 0.92 },
  { id: 'd2', name: 'Jasmine rice', quantityG: 180, calories: 230, protein: 4, carbs: 50, fat: 1, confidence: 0.86 },
  { id: 'd3', name: 'Cooking oil', quantityG: 10, calories: 90, protein: 0, carbs: 0, fat: 10, confidence: 0.42 },
];

export type UncertaintyOption = { label: string; deltaKcal: number };
export type UncertaintyPrompt = {
  id: string;
  question: string;
  baseKcal: number;
  options: UncertaintyOption[];
};

export const aiUncertaintyPrompts: UncertaintyPrompt[] = [
  {
    id: 'u1',
    question: "We see oil on the stir-fry but can't tell how much was used. What did you do?",
    baseKcal: 650,
    options: [
      { label: 'Dry / no oil', deltaKcal: 0 },
      { label: 'Light — 1 tsp', deltaKcal: 40 },
      { label: 'Medium — 1 tbsp', deltaKcal: 120 },
      { label: 'Heavy — 2+ tbsp', deltaKcal: 240 },
    ],
  },
  {
    id: 'u2',
    question: 'How was the chicken cooked?',
    baseKcal: 650,
    options: [
      { label: 'Grilled', deltaKcal: 0 },
      { label: 'Pan-fried', deltaKcal: 60 },
      { label: 'Deep-fried', deltaKcal: 160 },
      { label: 'Not sure', deltaKcal: 80 },
    ],
  },
];

// Voice entry transcript + parsed items.
export const aiVoiceTranscript =
  'Two scrambled eggs with a slice of toast and butter for breakfast';

export const aiVoiceItems: DetectedItem[] = [
  { id: 'v1', name: 'Scrambled eggs', quantityG: 100, calories: 195, protein: 13, carbs: 1, fat: 15, confidence: 0.9 },
  { id: 'v2', name: 'White toast', quantityG: 30, calories: 80, protein: 3, carbs: 15, fat: 1, confidence: 0.84 },
  { id: 'v3', name: 'Butter', quantityG: 7, calories: 50, protein: 0, carbs: 0, fat: 6, confidence: 0.55 },
];

// NOTE: barcode lookup is deliberately NOT here — it's a database lookup, not an
// AI call, and lives in lib/food/barcode.ts so this AI surface carries no cost
// for the barcode path.
