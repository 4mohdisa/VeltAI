// deriveGoals (src/lib/goals/derive.ts) — the profile-driven target used across
// the app. Mifflin–St Jeor BMR × activity factor (from gym sessions/week) + goal
// adjustment. Expected values computed by hand from the same formula.
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
    restrictions: [],
    allergies: [],
    cuisines: [],
    ...o,
  };
}

test('male, 3 sessions/week (factor 1.55), maintain', () => {
  // BMR 1780 × 1.55 = 2759 → 2760
  expect(deriveGoals(profile({})).calories).toBe(2760);
  expect(deriveGoals(profile({})).protein).toBe(144); // 80 × 1.8
});

test('female, 0 sessions (factor 1.2), lose (−400)', () => {
  // BMR = 600 + 1031.25 − 125 − 161 = 1345.25; ×1.2 = 1614.3; −400 = 1214.3 → 1210
  const r = deriveGoals(profile({ sex: 'female', weightKg: 60, heightCm: 165, age: 25, gymTargetPerWeek: 0, goal: 'lose' }));
  expect(r.calories).toBe(1210);
});

test('muscle goal uses +250 and 2.0 g/kg protein', () => {
  // BMR = 750 + 1112.5 − 140 + 5 = 1727.5; ×1.375 = 2375.3; +250 = 2625.3 → 2630
  const r = deriveGoals(profile({ goal: 'muscle', weightKg: 75, heightCm: 178, age: 28, gymTargetPerWeek: 2 }));
  expect(r.calories).toBe(2630);
  expect(r.protein).toBe(150);
});

test('activity factor tiers (1.2 / 1.375 / 1.55 / 1.725 / 1.9)', () => {
  const cals = (gym: number) => deriveGoals(profile({ gymTargetPerWeek: gym, goal: 'consistency' })).calories;
  // BMR 1780; ×factor rounded to 10.
  expect(cals(0)).toBe(2140); // 1.2  → 2136 → 2140
  expect(cals(1)).toBe(2450); // 1.375 → 2447.5 → 2450
  expect(cals(3)).toBe(2760); // 1.55
  expect(cals(6)).toBe(3070); // 1.725 → 3070.5 → 3070
  expect(cals(8)).toBe(3380); // 1.9 → 3382 → 3380
});

test("'other' sex uses the −78 midpoint offset", () => {
  // BMR = 800 + 1125 − 150 − 78 = 1697; ×1.55 = 2630.35 → 2630
  expect(deriveGoals(profile({ sex: 'other' })).calories).toBe(2630);
});

test('floors at 1200 kcal', () => {
  const r = deriveGoals(profile({ sex: 'female', weightKg: 42, heightCm: 150, age: 70, gymTargetPerWeek: 0, goal: 'lose' }));
  expect(r.calories).toBe(1200);
});

test('macros are internally consistent (fibre ≥ 25)', () => {
  const r = deriveGoals(profile({}));
  expect(r.fibre).toBeGreaterThanOrEqual(25);
  expect(r.fat).toBe(Math.round((r.calories * 0.25) / 9));
});
