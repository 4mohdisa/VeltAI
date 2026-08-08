// Client-side calorie/macro preview for the onboarding targets screen.
//
// This MUST stay byte-for-byte consistent with the backend derivation
// (backend/internal/goals/derive.go DeriveGoals), because the authoritative
// targets returned by POST /api/onboarding come from that Go function — the
// preview must not show a number that changes the moment onboarding completes.
// (JS Math.round matches Go math.Round for the positive values used here.)
import type { ActivityLevel, Goal, Sex } from '@/lib/types';

export type MacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
};

// Population medians used only when a user skips the (optional) height/weight
// inputs, so the preview and the POST payload stay in agreement. The onboarding
// flow writes these same fallbacks into the store before submitting.
export const DEFAULT_HEIGHT_CM = 170;
export const DEFAULT_WEIGHT_KG = 70;

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.9,
};

// Safety floor on the DERIVED target (guideline 1.4.1 — the app must not
// recommend an unsafe intake). This was a flat 1,200 for everyone, so a small,
// older, sedentary male on a "lose" goal was recommended 1,200 kcal/day; the
// widely-cited minimum for men is 1,500. 'other' takes the midpoint, matching
// how this file already handles 'other' in the BMR offset above.
// Mirrored by calorieFloor() in backend/internal/goals/derive.go — change both.
export function calorieFloor(sex: Sex): number {
  if (sex === 'male') return 1500;
  if (sex === 'female') return 1200;
  // Unspecified ("Prefer not to say") takes the HIGHER floor, not a midpoint.
  // Under guideline 1.4.1 the cautious answer must not buy a more permissive
  // safety limit: we do not know this person is not male, so we apply the
  // limit that is safe for everyone. Decided 2026-08-08, see DECISIONS.md.
  return 1500;
}

export type DeriveInput = {
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
};

export function deriveTargets(input: DeriveInput): MacroTargets {
  const heightCm = input.height_cm;
  const weightKg = input.weight_kg;

  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * input.age;
  if (input.sex === 'male') bmr += 5;
  else if (input.sex === 'female') bmr -= 161;
  else bmr -= 78; // 'other' → midpoint of the two offsets

  const factor = ACTIVITY_FACTORS[input.activity_level] ?? 1.2;
  const tdee = bmr * factor;

  let adj = 0;
  if (input.goal === 'lose') adj = -400;
  else if (input.goal === 'muscle') adj = 250;

  const calories = Math.max(calorieFloor(input.sex), Math.round((tdee + adj) / 10) * 10);
  const perKg = input.goal === 'muscle' ? 2.0 : 1.8;
  const protein = Math.round(weightKg * perKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const fibre = Math.max(25, Math.round((calories / 1000) * 14));

  return { calories, protein, carbs, fat, fibre };
}
