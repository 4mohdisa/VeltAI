// Goal derivation (Task 2) — a transparent, honest calorie/macro target computed
// from the user's onboarding inputs. This replaces the hardcoded mock target as the
// "AI recommendation"; it stays editable via the custom-goals override.
//
// Formula (industry-standard, nothing fabricated):
//   BMR   — Mifflin–St Jeor
//   TDEE  — BMR × activity factor (from target gym sessions/week)
//   Target— TDEE + goal adjustment (deficit to lose, surplus to build muscle)
//   Macros— protein from bodyweight, fat 25% of energy, carbs the remainder,
//           fibre 14 g per 1,000 kcal.
import type { MacroGoals } from '@/lib/settings/store';
import type { UserProfile } from '@/lib/data/userStore';
import { deriveTargets } from '@/lib/onboarding/deriveTargets';
import type { Goal } from '@/lib/types';

function bmrMifflin(weightKg: number, heightCm: number, age: number, sex: UserProfile['sex']): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  return base - 78; // 'other' → midpoint of the two offsets
}

function activityFactor(gymPerWeek: number): number {
  if (gymPerWeek <= 0) return 1.2; //   sedentary
  if (gymPerWeek <= 2) return 1.375; // light
  if (gymPerWeek <= 4) return 1.55; //  moderate
  if (gymPerWeek <= 6) return 1.725; // active
  return 1.9; //                        very active
}

function goalAdjustment(goal: UserProfile['goal']): number {
  if (goal === 'lose') return -400; // moderate deficit
  if (goal === 'muscle') return 250; // lean surplus
  return 0; //                          consistency / eat-better / sleep / health → maintain
}

/**
 * Derive the calorie + macro targets from a user profile.
 *
 * This is a thin adapter over lib/onboarding/deriveTargets, which is the ONE
 * formula — the same one the onboarding preview shows and the same one
 * backend/internal/goals/derive.go implements. It used to be a second,
 * independent copy that fed on gymTargetPerWeek instead of the activity level
 * the user actually chose, so onboarding could promise 2,340 kcal and the
 * dashboard then show a different number for the same person.
 */
export function deriveGoals(profile: UserProfile): MacroGoals {
  return deriveTargets({
    age: profile.age,
    sex: profile.sex,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    activity_level: profile.activityLevel,
    goal: goalForDerivation(profile.goal),
  });
}

/** UserProfile.goal carries app-level goals ('consistency', 'sleep', …) that the
 *  shared formula does not know; everything that is not lose/muscle maintains. */
function goalForDerivation(goal: UserProfile['goal']): Goal {
  if (goal === 'lose') return 'lose';
  if (goal === 'muscle') return 'muscle';
  return 'track';
}
