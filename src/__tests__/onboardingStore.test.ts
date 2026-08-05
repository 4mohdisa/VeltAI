// Onboarding store + payload assembly. onboardingPayload is pure; the store is
// zustand-backed and persists via the secure-store adapter (mocked in jest).
import { useOnboardingStore, onboardingPayload } from '@/lib/stores/onboarding';
import { secureStorage } from '@/lib/stores/secureStorage';
import type { OnboardingSession } from '@/lib/types';

const base: OnboardingSession = {
  goal: 'lose',
  activity_level: 'moderate',
  cuisines: ['western'],
  dietary_requirements: ['halal'],
  age: 30,
  sex: 'male',
  height_cm: 180,
  weight_kg: 80,
  target_weight_kg: 75,
  calorie_target: null,
  body_type: null,
};

describe('onboardingPayload', () => {
  test('includes every set field with canonical units', () => {
    expect(onboardingPayload(base)).toMatchObject({
      age: 30,
      sex: 'male',
      height: 180,
      height_unit: 'cm',
      weight: 80,
      weight_unit: 'kg',
      activity_level: 'moderate',
      goal: 'lose',
      cuisines: ['western'],
      dietary_requirements: ['halal'],
    });
  });

  test('omits body_type when unset', () => {
    expect('body_type' in onboardingPayload(base)).toBe(false);
  });

  test('includes body_type when set', () => {
    expect(onboardingPayload({ ...base, body_type: 'skinny' }).body_type).toBe('skinny');
  });

  test('defaults unset optionals to safe values', () => {
    const sparse: OnboardingSession = {
      ...base,
      age: null,
      sex: null,
      height_cm: null,
      weight_kg: null,
      activity_level: null,
      goal: null,
    };
    expect(onboardingPayload(sparse)).toMatchObject({
      age: 0,
      sex: 'other',
      height: 0,
      weight: 0,
      activity_level: 'sedentary',
      goal: 'track',
    });
  });
});

describe('onboarding store', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  test('setters update state', () => {
    const s = useOnboardingStore.getState();
    s.setGoal('muscle');
    s.setBodyType('skinny');
    s.setActivity('light');
    s.setMeasurements({ age: 28, sex: 'female', height_cm: 165, weight_kg: 60 });
    const now = useOnboardingStore.getState();
    expect(now.goal).toBe('muscle');
    expect(now.body_type).toBe('skinny');
    expect(now.activity_level).toBe('light');
    expect(now.age).toBe(28);
  });

  test('reset() clears back to empty', () => {
    useOnboardingStore.getState().setGoal('lose');
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().goal).toBeNull();
    expect(useOnboardingStore.getState().body_type).toBeNull();
  });

  test('payload reflects the live store', () => {
    const s = useOnboardingStore.getState();
    s.setMeasurements({ age: 40, sex: 'male', height_cm: 175, weight_kg: 70 });
    s.setActivity('light');
    s.setGoal('track');
    const p = onboardingPayload(useOnboardingStore.getState());
    expect(p.age).toBe(40);
    expect(p.activity_level).toBe('light');
    expect(p.goal).toBe('track');
  });

  test('secure-store adapter round-trips (persist + rehydrate)', async () => {
    await secureStorage.setItem('lume.test', JSON.stringify({ goal: 'muscle' }));
    const raw = await secureStorage.getItem('lume.test');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).goal).toBe('muscle');
  });
});
