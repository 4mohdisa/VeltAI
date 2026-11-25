// bodyFromOnboarding maps the stored onboarding goal through goalTypeOf, the
// one goal mapping (src/lib/goals/derive.ts). Before, only lose and muscle were
// mapped, so a maintain or eat healthier user fell back to the store's 'lose'.
import type { Onboarding } from '@/lib/api';
import { bodyFromOnboarding } from '@/lib/data/hooks';

const onboarding = (goal: string | null): Onboarding => ({
  completed: true,
  age: 30,
  sex: 'male',
  height: 178,
  height_unit: 'cm',
  weight: 82,
  weight_unit: 'kg',
  activity_level: 'moderate',
  goal,
});

test.each([
  ['lose', 'lose'],
  ['muscle', 'muscle'],
  ['track', 'consistency'],
  ['eat_healthier', 'eat-better'],
])('a stored %s goal maps to %s', (stored, expected) => {
  expect(bodyFromOnboarding(onboarding(stored)).goal).toBe(expected);
});

test.each([['maintain'], [null]])('a %s goal is left unset, so the store keeps its own', (stored) => {
  expect(bodyFromOnboarding(onboarding(stored))).not.toHaveProperty('goal');
});

test('the other fields are unchanged by the goal mapping', () => {
  expect(bodyFromOnboarding(onboarding('track'))).toEqual({
    weightKg: 82,
    heightCm: 178,
    age: 30,
    sex: 'male',
    activityLevel: 'moderate',
    goal: 'consistency',
  });
});
