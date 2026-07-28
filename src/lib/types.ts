// UI-facing composite types for the onboarding + scan-review + meal-builder
// surfaces. Backend row shapes (snake_case) live in @/lib/api and are re-exported
// here so screens have one import site; the types below are the app-only ones
// (selection unions, the client-side confidence model, the assembled session).

export type {
  SavedMeal,
  SavedMealItem,
  SavedMealInput,
  Recipe,
  RecipeIngredient,
  RecipeInput,
  RecipePatch,
  ScanCalibration,
  CalibrationFactor,
  ScanAccuracySummary,
  ScanCorrectionInput,
  ScanCorrectionResult,
  ScanFeedbackRating,
  PortionMemory,
  QuickAddInput,
  MorningBrief,
  AIInsight,
  AIAnomaly,
  AIBrainProfile,
  ExerciseLibraryItem,
  TemplateExercise,
  WorkoutTemplate,
  ScheduleDay,
  WeeklySchedule,
  TodayWorkout,
  AdherenceResult,
  GymPatterns,
  ProgressEntry,
  PersonalBest,
  ExerciseProgress,
  TemplateExerciseInput,
  TemplateInput,
  TemplatePatch,
  ExerciseFilters,
  EnergyBalance,
  WeeklyEnergyBalance,
  IntegrationConnection,
  IntegrationSyncResult,
  ParameterField,
  ParameterSchema,
  LoggedParameters,
  CalorieResult,
} from '@/lib/api';

/** Self-reported body composition at onboarding; drives the goal suggestion. */
export type BodyType = 'skinny' | 'skinny_fat' | 'average' | 'overweight' | 'muscular';

// --- Onboarding selections ----------------------------------------------------

/** Goal values are sent verbatim to POST /api/onboarding; the backend applies a
 *  calorie adjustment for 'lose'/'muscle' and maintains for everything else. */
export type Goal = 'lose' | 'muscle' | 'eat_healthier' | 'track';

/** Activity values map 1:1 to the backend's activity-factor table. */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';

export type Sex = 'male' | 'female' | 'other';

export type CuisineType =
  | 'south_asian'
  | 'east_asian'
  | 'southeast_asian'
  | 'middle_eastern'
  | 'mediterranean'
  | 'western'
  | 'african'
  | 'latin_american';

/** Dietary requirements the backend filters the seeded food library by. Only
 *  halal/vegetarian/vegan/gluten_free are acted on server-side; dairy_free is
 *  collected for future use and 'none' clears the set. */
export type DietaryRequirement = 'halal' | 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'none';

/** The full set of answers collected across the onboarding flow, assembled into
 *  the POST /api/onboarding payload at the end. Mirrors the onboarding store. */
export type OnboardingSession = {
  goal: Goal | null;
  activity_level: ActivityLevel | null;
  cuisines: CuisineType[];
  dietary_requirements: DietaryRequirement[];
  age: number | null;
  sex: Sex | null;
  height_cm: number | null;
  weight_kg: number | null;
  target_weight_kg: number | null;
  calorie_target: number | null; // manual override of the derived preview, when set
  body_type: BodyType | null;
};

// --- Scan confidence model (client-side) --------------------------------------

/** One line in the confidence breakdown, e.g. { label: 'Plate detected', points: 20 }. */
export type ConfidenceFactor = { label: string; points: number };

/** The scan's overall confidence (0..100) with its contributing factors, shown
 *  behind the "Why?" disclosure on a review card. */
export type ConfidenceBreakdown = { score: number; factors: ConfidenceFactor[] };

/** Client-side status for a scanned food row. The backend scan flow is
 *  synchronous (no status column); this models the local capture→review→save
 *  lifecycle that drives which card variant renders. */
export type ScanItemStatus = 'analyzing' | 'ready' | 'confirmed' | 'failed';
