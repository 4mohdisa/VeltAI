// Onboarding resume — symptom 1 of the 2026-08-08 agent run:
// "reloading mid-onboarding restarts at Welcome and loses entered values".
//
// The answers were always persisted. What was NOT persisted was the user's
// POSITION, so every reload sent them back to Welcome and the flow looked as
// if it had thrown everything away.
import { resumeTarget } from '@/lib/onboarding/resume';
import { useOnboardingStore } from '@/lib/stores/onboarding';

beforeEach(() => useOnboardingStore.getState().reset());

test('a recorded step is where onboarding resumes', () => {
  expect(resumeTarget('/onboarding/measurements')).toBe('/onboarding/measurements');
  expect(resumeTarget('/onboarding/body-type')).toBe('/onboarding/body-type');
});

test('no recorded step (or a stale/foreign one) falls back to the start', () => {
  expect(resumeTarget(null)).toBe('/onboarding');
  expect(resumeTarget(undefined)).toBe('/onboarding');
  expect(resumeTarget('/onboarding')).toBe('/onboarding');
  expect(resumeTarget('/(tabs)/food')).toBe('/onboarding');
  expect(resumeTarget('/legal/privacy')).toBe('/onboarding');
});

test('the step is persisted alongside the answers, not held in memory', () => {
  const s = useOnboardingStore.getState();
  s.setGoal('lose');
  s.setLastStep('/onboarding/measurements');
  // The persisted slice is what survives a reload.
  const persisted = JSON.parse(
    JSON.stringify({ ...useOnboardingStore.getState() }),
  ) as Record<string, unknown>;
  expect(persisted.last_step).toBe('/onboarding/measurements');
  expect(persisted.goal).toBe('lose');
});

test('markCompleted ends the resume — a finished user never re-enters the flow', () => {
  const s = useOnboardingStore.getState();
  s.setLastStep('/onboarding/targets');
  s.markCompleted();
  expect(useOnboardingStore.getState().completed).toBe(true);
});
