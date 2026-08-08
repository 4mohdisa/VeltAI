// Client/server contract parity for the onboarding payload (item 8 of the
// 2026-08-08 agent run). Every rule the server enforces must be enforced here
// first, so a missing answer is named in the UI instead of returning as an
// opaque 400. This project has already shipped a validator strict enough to
// reject its own client; a hermetic suite could not see it.
import { validateOnboardingPayload, onboardingPayload } from '@/lib/stores/onboarding';
import type { OnboardingSession } from '@/lib/types';

const complete: OnboardingSession = {
  goal: 'lose',
  activity_level: 'moderate',
  cuisines: ['south_asian'],
  dietary_requirements: [],
  age: 30,
  sex: 'male',
  height_cm: 180,
  weight_kg: 80,
  target_weight_kg: 75,
  calorie_target: null,
  body_type: null,
};

test('a complete session passes', () => {
  expect(validateOnboardingPayload(complete)).toBeNull();
});

test.each([
  ['age', { age: null }, /age/i],
  ['sex', { sex: null }, /sex/i],
  ['height', { height_cm: null }, /height/i],
  ['weight', { weight_kg: null }, /weight/i],
  ['activity level', { activity_level: null }, /activity/i],
  ['goal', { goal: null }, /goal/i],
])('a missing %s is named before any request is spent', (_label, patch, re) => {
  const msg = validateOnboardingPayload({ ...complete, ...patch } as OnboardingSession);
  expect(msg).not.toBeNull();
  expect(msg!).toMatch(re);
});

// The server band is 13..120 (backend/internal/goals). The client must be
// neither looser (produces the 400 it exists to prevent) nor stricter
// (silently refuses input the API would accept).
test.each([12, 121, 0, -1])('age %s is rejected, matching the server band', (age) => {
  expect(validateOnboardingPayload({ ...complete, age })).not.toBeNull();
});
test.each([13, 30, 120])('age %s is accepted, matching the server band', (age) => {
  expect(validateOnboardingPayload({ ...complete, age })).toBeNull();
});

// Height and weight became REQUIRED on 2026-08-08. The contract check used to
// pass for a user who skipped them, because the measurements screen filled in
// population medians before this ever ran — so the invented body data reached
// Mifflin-St Jeor with nothing objecting. It must now fail without real values.
test.each([
  ['height', { height_cm: null }],
  ['weight', { weight_kg: null }],
])('a missing %s now FAILS the contract (no median fills the gap)', (_label, patch) => {
  const msg = validateOnboardingPayload({ ...complete, ...patch } as OnboardingSession);
  expect(msg).not.toBeNull();
});

test.each([
  ['height too small', { height_cm: 99 }],
  ['height too large', { height_cm: 251 }],
  ['weight too small', { weight_kg: 29 }],
  ['weight too large', { weight_kg: 301 }],
])('%s is rejected, matching the server bounds', (_label, patch) => {
  expect(validateOnboardingPayload({ ...complete, ...patch } as OnboardingSession)).not.toBeNull();
});

test.each([
  ['height at the low bound', { height_cm: 100 }],
  ['height at the high bound', { height_cm: 250 }],
  ['weight at the low bound', { weight_kg: 30 }],
  ['weight at the high bound', { weight_kg: 300 }],
])('%s is accepted, matching the server bounds', (_label, patch) => {
  expect(validateOnboardingPayload({ ...complete, ...patch } as OnboardingSession)).toBeNull();
});

test('an absurd target weight is caught client-side', () => {
  expect(validateOnboardingPayload({ ...complete, target_weight_kg: 5000 })).not.toBeNull();
  expect(validateOnboardingPayload({ ...complete, target_weight_kg: -5 })).not.toBeNull();
});

test('the payload sends what the user actually answered', () => {
  const p = onboardingPayload(complete);
  expect(p).toMatchObject({
    age: 30,
    sex: 'male',
    height: 180,
    height_unit: 'cm',
    weight: 80,
    weight_unit: 'kg',
    activity_level: 'moderate',
    goal: 'lose',
    target_weight: 75,
  });
});

// Guard the substitution that used to hide an unanswered question: sex moves
// BMR by 166 kcal and sets the 1.4.1 safety floor, so defaulting it to 'other'
// decided something material the user never did.
test('an unanswered sex is blocked rather than silently sent as "other"', () => {
  const session = { ...complete, sex: null } as OnboardingSession;
  expect(validateOnboardingPayload(session)).toMatch(/sex/i);
});
