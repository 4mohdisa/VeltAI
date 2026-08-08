/// <reference types="jest" />
/// <reference types="node" />
// Guard against the failure that has hit this codebase THREE times: showing
// fabricated data to a real user as if it were their own.
//   1. A fake Apple Health screen reporting a hardcoded 540 kcal / 8,240 steps.
//   2. A voice screen playing a canned transcript and "saving" nothing.
//   3. Every store seeding mock data — a signed-in user saw "Bilal Ahmed",
//      meals they never logged and a 13-day streak they never earned, because
//      the seed was unconditional and nothing hydrated the profile.
//
// The rule these tests encode: in a RELEASE build the stores start EMPTY.
// Dev builds keep the seed so the keyless offline experience stays navigable.
import { readFileSync } from 'fs';
import { join } from 'path';

const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('release builds contain no fabricated user data', () => {
  // isDevBuild() reads __DEV__, which jest leaves undefined (treated as dev).
  // Re-import each store with __DEV__ forced false to observe release seeding.
  const asRelease = <T,>(load: () => T): T => {
    const g = globalThis as { __DEV__?: boolean };
    const prev = g.__DEV__;
    g.__DEV__ = false;
    jest.resetModules();
    try {
      return load();
    } finally {
      g.__DEV__ = prev;
      jest.resetModules();
    }
  };

  test('the user profile carries no invented identity', () => {
    const profile = asRelease(() => require('@/lib/data/userStore').useUserStore.getState().profile);
    expect(profile.name).toBe('');
    expect(profile.email).toBe('');
    // The specific value that shipped, named so a regression is unmistakable.
    expect(profile.email).not.toContain('bilal');
    expect(profile.name).not.toBe('Bilal Ahmed');
  });

  test('body metrics are not invented (they feed calorie targets — 1.4.1)', () => {
    const profile = asRelease(() => require('@/lib/data/userStore').useUserStore.getState().profile);
    expect(profile.weightKg).toBe(0);
    expect(profile.heightCm).toBe(0);
    expect(profile.age).toBe(0);
  });

  test('the food log starts empty — no meals the user never logged', () => {
    const s = asRelease(() => require('@/lib/data/foodStore').useFoodStore.getState());
    expect(s.meals).toEqual([]);
    expect(s.savedFoods).toEqual([]);
  });

  test('the gym store starts empty — no streak the user never earned', () => {
    const s = asRelease(() => require('@/lib/data/gymStore').useGymStore.getState());
    expect(s.sessions).toEqual([]);
    expect(s.calendar).toEqual([]);
    expect(s.streak.current).toBe(0);
    expect(s.streak.totalGymDays).toBe(0);
    expect(s.streak.longest).toBe(0);
  });

  test('sign-out reset also yields empty stores in a release build', () => {
    const s = asRelease(() => {
      const gym = require('@/lib/data/gymStore').useGymStore;
      gym.getState().reset();
      return gym.getState();
    });
    expect(s.sessions).toEqual([]);
    expect(s.streak.current).toBe(0);
  });

  test('dev builds KEEP the seed (the offline experience must stay navigable)', () => {
    // Default jest env: __DEV__ undefined -> isDevBuild() true.
    jest.resetModules();
    const profile = require('@/lib/data/userStore').useUserStore.getState().profile;
    expect(profile.name.length).toBeGreaterThan(0);
    const gym = require('@/lib/data/gymStore').useGymStore.getState();
    expect(gym.sessions.length).toBeGreaterThan(0);
  });

  test('the profile is hydrated from the server, not left at its seed', () => {
    // The bug was that GET /api/profile was never called anywhere in the app.
    expect(src('lib/data/hooks.ts')).toContain('api.profile.get()');
    expect(src('lib/data/hooks.ts')).toMatch(/hydrateProfile/);
  });

  test('no screen imports mock data at runtime (type-only imports are fine)', () => {
    const { execSync } = require('child_process');
    const out = execSync(
      "grep -rn \"from '@/lib/mock\" src/app src/components --include='*.tsx' || true",
      { cwd: join(__dirname, '..', '..'), encoding: 'utf8' },
    ) as string;
    const runtime = out
      .split('\n')
      .filter(Boolean)
      .filter((l) => !/import\s+type\s/.test(l));
    expect(runtime).toEqual([]);
  });
});

// --- Inputs that used to be discarded ----------------------------------------
// A screen that collects a value, shows it changing, and then throws it away is
// a lie about what the app did. Both of these were live inputs whose values
// never left the device.
describe('onboarding sends every answer it collects', () => {
  const payload = () => {
    jest.resetModules();
    const { onboardingPayload, useOnboardingStore } = require('@/lib/stores/onboarding');
    const s = useOnboardingStore.getState();
    s.setMeasurements({ age: 30, sex: 'male', height_cm: 180, weight_kg: 80, target_weight_kg: 72 });
    s.setActivity('moderate');
    s.setGoal('lose');
    s.setCalorieTarget(2100);
    return onboardingPayload(useOnboardingStore.getState());
  };

  test('the target weight the user typed is in the POST body', () => {
    expect(payload().target_weight).toBe(72);
  });

  test('the manually adjusted calorie target is in the POST body', () => {
    expect(payload().calorie_target).toBe(2100);
  });

  test('optional overrides are omitted rather than sent as 0/null', () => {
    jest.resetModules();
    const { onboardingPayload, useOnboardingStore } = require('@/lib/stores/onboarding');
    const p = onboardingPayload(useOnboardingStore.getState());
    expect(p).not.toHaveProperty('target_weight');
    expect(p).not.toHaveProperty('calorie_target');
  });
});

describe('the calorie formula has exactly one definition', () => {
  test('deriveGoals agrees with deriveTargets for the same person', () => {
    const { deriveGoals } = require('@/lib/goals/derive');
    const { deriveTargets } = require('@/lib/onboarding/deriveTargets');
    const person = {
      age: 28,
      sex: 'female' as const,
      height_cm: 165,
      weight_kg: 62,
      activity_level: 'moderate' as const,
      goal: 'lose' as const,
    };
    const fromProfile = deriveGoals({
      name: '',
      email: '',
      memberSince: '',
      weightKg: person.weight_kg,
      heightCm: person.height_cm,
      age: person.age,
      sex: person.sex,
      goal: 'lose',
      targetWeightKg: 0,
      gymTargetPerWeek: 6, // deliberately inconsistent — must NOT affect the result
      activityLevel: person.activity_level,
      restrictions: [],
      allergies: [],
      cuisines: [],
    });
    expect(fromProfile).toEqual(deriveTargets(person));
  });

  // REWRITTEN: this test asserted a flat floor of 1200 for every sex. That was
  // the behaviour, and the behaviour was wrong — a flat 1200 recommends the
  // female minimum to men, for whom the widely-cited floor is 1500 (1.4.1). The
  // floor is now sex-aware (src/lib/onboarding/deriveTargets.ts calorieFloor,
  // mirrored in backend/internal/goals/derive.go), so the expectation moved with
  // it. The test's intent is unchanged: an empty profile still gets the floor
  // and never a fabricated protein goal.
  test('a release-build profile with no metrics yields no confident target', () => {
    // 0 kg / 0 cm cannot produce a real recommendation. The floor still applies,
    // but protein must not be presented as a real 0 g goal derived from nothing.
    const { deriveGoals } = require('@/lib/goals/derive');
    const emptyProfile = (sex: 'male' | 'female' | 'other') => ({
      name: '',
      email: '',
      memberSince: '',
      weightKg: 0,
      heightCm: 0,
      age: 0,
      sex,
      goal: 'lose' as const,
      targetWeightKg: 0,
      gymTargetPerWeek: 0,
      activityLevel: 'sedentary' as const,
      restrictions: [],
      allergies: [],
      cuisines: [],
    });

    expect(deriveGoals(emptyProfile('other')).protein).toBe(0);
    // The floor binds, and it is the SEX-AWARE floor.
    expect(deriveGoals(emptyProfile('female')).calories).toBe(1200);
    expect(deriveGoals(emptyProfile('male')).calories).toBe(1500);
    // 'other' floors at 1500 since 2026-08-08 (see DECISIONS.md).
    expect(deriveGoals(emptyProfile('other')).calories).toBe(1500);
  });

  // The specific unsafe recommendation the flat floor allowed: a small, older,
  // sedentary man on a "lose" goal. TDEE lands near 1,251; minus the 400 kcal
  // deficit that is 851, which the old flat floor lifted only to 1,200.
  test('a real body that hits the floor gets the male minimum, not 1200', () => {
    const { deriveTargets } = require('@/lib/onboarding/deriveTargets');
    const t = deriveTargets({
      age: 60,
      sex: 'male' as const,
      height_cm: 150,
      weight_kg: 40,
      activity_level: 'sedentary' as const,
      goal: 'lose' as const,
    });
    expect(t.calories).toBe(1500);
  });
});

// --- Identity consistency ----------------------------------------------------
describe('the OAuth deep link uses the scheme this app actually registers', () => {
  const appJson = () => JSON.parse(readFileSync(join(__dirname, '..', '..', 'app.json'), 'utf8')).expo;

  test('the backend default scheme equals app.json expo.scheme', () => {
    // These two once disagreed: the backend hardcoded one scheme while
    // app.json registered another, so any callback that escaped the in-app
    // auth session hit an unregistered scheme and dead-ended with no way back
    // into the app. This test is what keeps them equal through a rename.
    const go = readFileSync(
      join(__dirname, '..', '..', 'backend/internal/integrations/integrations.go'),
      'utf8',
    );
    const m = go.match(/config\.Env\("LUME_APP_SCHEME",\s*"([^"]+)"\)/);
    expect(m).not.toBeNull();
    expect(m![1]).toBe(appJson().scheme);
  });

  test('no source file hardcodes a deep-link scheme any more', () => {
    const { execSync } = require('child_process');
    const hits = execSync(
      "grep -rn 'lume://' src backend --include='*.ts' --include='*.tsx' --include='*.go' " +
        "--exclude-dir=__tests__ --exclude-dir=tests || true",
      { cwd: join(__dirname, '..', '..'), encoding: 'utf8' },
    ) as string;
    // Comments explaining the old value are fine; a live string literal is not.
    const code = hits
      .split('\n')
      .filter(Boolean)
      .filter((l) => {
        const body = l.slice(l.indexOf(':', l.indexOf(':') + 1) + 1).trim();
        return !body.startsWith('//') && !body.startsWith('*');
      });
    expect(code).toEqual([]);
  });
});
