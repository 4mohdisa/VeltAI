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

/** Derive the calorie + macro targets from a user profile. Deterministic, editable. */
export function deriveGoals(profile: UserProfile): MacroGoals {
  const bmr = bmrMifflin(profile.weightKg, profile.heightCm, profile.age, profile.sex);
  const tdee = bmr * activityFactor(profile.gymTargetPerWeek);
  // Floor at a safe minimum so we never recommend an unhealthy target.
  const calories = Math.max(1200, Math.round((tdee + goalAdjustment(profile.goal)) / 10) * 10);

  const proteinPerKg = profile.goal === 'muscle' ? 2.0 : 1.8;
  const protein = Math.round(profile.weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const fibre = Math.max(25, Math.round((calories / 1000) * 14));

  return { calories, protein, carbs, fat, fibre };
}
