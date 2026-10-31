// Every screen that reads through useHydration says so when the read fails.
//
// The hook now reports a real error (see render/hydrationErrorState). This pins
// the other half: each non-parked caller renders LoadFailedNotice rather than
// letting whatever the store already held pass as current.
//
// The parked screens (gym/streak, gym/history, gym/freeze) are deliberately NOT
// in this list — they only read `data` and must not be edited. That gap is
// recorded in DECISIONS.md rather than papered over here.
import { readFileSync } from 'fs';
import { join } from 'path';

const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const CALLERS = [
  'app/(tabs)/index.tsx', //      Summary      — useDashboard
  'app/(tabs)/food.tsx', //       Food log     — useFoodLog
  'app/(tabs)/gym.tsx', //        Gym          — useGym
  'app/dashboard/nutrition.tsx', // Macros     — useFoodLog
  'app/food/saved.tsx', //        Saved foods  — useSavedFoods
  'app/profile/index.tsx', //     Settings     — useGym
];

test.each(CALLERS)('%s renders an honest failure state', (path) => {
  const s = code(src(path));
  expect(s).toContain('LoadFailedNotice');
  // and it is conditional on a real error, not always-on decoration
  expect(s).toMatch(/(loadError|dashError|gymError)\s*\?/);
});

test('the hook hands callers a real Error instead of a permanent null', () => {
  const hooks = code(src('lib/data/hooks.ts'));
  expect(hooks).toContain('setError(e instanceof Error ? e : new Error');
  expect(hooks).not.toMatch(/return \{ isLoading, error: null, refetch \}/);
});

test("Summary's combined read reports an outage instead of resolving regardless", () => {
  // allSettled never rejects; without inspecting the results Summary would call
  // every outage a success and go back to showing its seed as current.
  const hooks = code(src('lib/data/hooks.ts'));
  expect(hooks).toMatch(/const \[food, gym\] = await Promise\.allSettled/);
  expect(hooks).toMatch(/throw failed\.reason/);
});

test('a failed food read no longer hides rows the device already has', () => {
  // This line used to blank the whole list on error, so a failed refresh hid
  // local rows — including queued offline writes — behind an error screen.
  const s = code(src('app/(tabs)/food.tsx'));
  expect(s).not.toMatch(/if \(loadError \|\| loading \|\| itemCount === 0\) return \[\]/);
  expect(s).toMatch(/if \(loading \|\| itemCount === 0\) return \[\]/);
});

test('no screen invents a reason for the failure', () => {
  // The fetch layer supplies no user-facing cause, so the copy must not claim
  // one (no "server", "network down", "500", etc. in the notice messages).
  for (const path of CALLERS) {
    const messages = [...code(src(path)).matchAll(/LoadFailedNotice[^>]*message="([^"]+)"/g)].map((m) => m[1]);
    for (const msg of messages) {
      expect(msg).toMatch(/^Couldn't load/);
      expect(msg).not.toMatch(/server|network|offline|500|timeout/i);
    }
  }
  const copy = (locale: string, path: string) =>
    path.split('.').reduce((node, key) => node[key], JSON.parse(src(`lib/i18n/locales/${locale}.json`)));
  const keys = CALLERS.flatMap((path) =>
    [...code(src(path)).matchAll(/LoadFailedNotice[^>]*message=\{t\('([^']+)'\)\}/g)].map((m) => m[1]),
  );
  expect(keys).toContain('dashboard.streakLoadError');
  for (const key of keys) {
    expect(copy('en', key)).toMatch(/^Couldn't load/);
    expect(copy('en', key)).not.toMatch(/server|network|offline|500|timeout/i);
    expect(copy('es', key)).toMatch(/\S/);
    expect(copy('fr', key)).toMatch(/\S/);
  }
});
