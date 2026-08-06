// Goal derivation — a thin adapter over lib/onboarding/deriveTargets, which is
// the ONE canonical formula (mirrored exactly by backend/internal/goals/
// derive.go).
//
// The audit of 2026-08-06 deleted the dead remains of the OLD independent
// formula that used to live here (bmrMifflin / activityFactor /
// goalAdjustment, keyed on gymTargetPerWeek instead of the chosen activity
// level) — the very duplicate that once let onboarding promise one calorie
// target and the dashboard show another for the same person. Do not
// reintroduce a second derivation in this file.
import type { MacroGoals } from '@/lib/settings/store';
import type { UserProfile } from '@/lib/data/userStore';
import { deriveTargets } from '@/lib/onboarding/deriveTargets';
import type { Goal } from '@/lib/types';

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
