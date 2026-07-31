// deriveGoals (src/lib/goals/derive.ts) — the profile-driven target used across
// the app. It is now a thin adapter over lib/onboarding/deriveTargets, which is
// the ONE formula: the same one the onboarding preview renders and the same one
// backend/internal/goals/derive.go implements. Mifflin–St Jeor BMR × activity
// factor (from the activity level the user CHOSE) + goal adjustment. Expected
// values computed by hand.
//
// Before this was collapsed, deriveGoals ran its own copy keyed on
// gymTargetPerWeek, so onboarding could promise one calorie target and every
// screen afterwards show a different one for the same person.
import { deriveGoals } from '@/lib/goals/derive';
import type { UserProfile } from '@/lib/data/userStore';

function profile(o: Partial<UserProfile>): UserProfile {
  return {
    name: 'Test',
    email: 't@e.com',
    memberSince: '2026',
    weightKg: 80,
    heightCm: 180,
    age: 30,
    sex: 'male',
    goal: 'consistency',
    targetWeightKg: 75,
    gymTargetPerWeek: 3,
    activityLevel: 'moderate',
    restrictions: [],
    allergies: [],
    cuisines: [],
    ...o,
  };
}

test('male, moderate (factor 1.55), maintain', () => {
  // BMR 1780 × 1.55 = 2759 → 2760
  expect(deriveGoals(profile({})).calories).toBe(2760);
  expect(deriveGoals(profile({})).protein).toBe(144); // 80 × 1.8
});

test('female, sedentary (factor 1.2), lose (−400)', () => {
  // BMR = 600 + 1031.25 − 125 − 161 = 1345.25; ×1.2 = 1614.3; −400 = 1214.3 → 1210
  const r = deriveGoals(profile({ sex: 'female', weightKg: 60, heightCm: 165, age: 25, activityLevel: 'sedentary', goal: 'lose' }));
  expect(r.calories).toBe(1210);
});

test('muscle goal uses +250 and 2.0 g/kg protein', () => {
  // BMR = 750 + 1112.5 − 140 + 5 = 1727.5; ×1.375 = 2375.3; +250 = 2625.3 → 2630
  const r = deriveGoals(profile({ goal: 'muscle', weightKg: 75, heightCm: 178, age: 28, activityLevel: 'light' }));
  expect(r.calories).toBe(2630);
  expect(r.protein).toBe(150);
});

test('activity factor tiers (1.2 / 1.375 / 1.55 / 1.9)', () => {
  const cals = (activityLevel: UserProfile['activityLevel']) =>
    deriveGoals(profile({ activityLevel, goal: 'consistency' })).calories;
  // BMR 1780; ×factor rounded to 10. These are the only four levels the
  // onboarding UI offers and the only four the client type allows.
  expect(cals('sedentary')).toBe(2140); // 1.2   → 2136 → 2140
  expect(cals('light')).toBe(2450); //     1.375 → 2447.5 → 2450
  expect(cals('moderate')).toBe(2760); //  1.55
  expect(cals('very_active')).toBe(3380); // 1.9 → 3382 → 3380
});

test("'other' sex uses the −78 midpoint offset", () => {
  // BMR = 800 + 1125 − 150 − 78 = 1697; ×1.55 = 2630.35 → 2630
  expect(deriveGoals(profile({ sex: 'other' })).calories).toBe(2630);
});

test('floors at 1200 kcal', () => {
  const r = deriveGoals(profile({ sex: 'female', weightKg: 42, heightCm: 150, age: 70, activityLevel: 'sedentary', goal: 'lose' }));
  expect(r.calories).toBe(1200);
});

test('macros are internally consistent (fibre ≥ 25)', () => {
  const r = deriveGoals(profile({}));
  expect(r.fibre).toBeGreaterThanOrEqual(25);
  expect(r.fat).toBe(Math.round((r.calories * 0.25) / 9));
});
