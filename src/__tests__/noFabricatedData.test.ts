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
