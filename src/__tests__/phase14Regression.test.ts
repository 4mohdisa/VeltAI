/// <reference types="node" />
// Phase 14 re-verification (Part 1.6), client half. One test per audited claim,
// asserted independently of the tests that shipped each fix — a prior audit
// report is not evidence. Backend halves live in
// backend/tests/regression/phase14_test.go.
//
// Screens can't be rendered here (node env, no react-native), so screen-level
// gating is locked with source assertions over the real files — the same
// technique secretsPosture.test.ts uses. Overlap with resetRegistry.test.ts,
// authMachine.test.ts, stores.test.ts and apiClient.test.ts is deliberate.
import * as fs from 'fs';
import * as path from 'path';

import { transition, mayHydrateCachedData } from '@/lib/auth/machine';
import { resetAllStores } from '@/lib/auth/resetRegistry';
import { AI_CONSENT_KEY, hasAiConsent, __resetAiConsentCache } from '@/lib/ai/consent';
import { clampCalories, CALORIE_TARGET_MIN, CALORIE_TARGET_MAX, useSettingsStore } from '@/lib/settings/store';
import { useFoodStore } from '@/lib/data/foodStore';
import { useUserStore } from '@/lib/data/userStore';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { enqueue, pendingCount, loadQueue } from '@/lib/offline/queue';
import { track, pendingCount as analyticsPending } from '@/lib/analytics';
import { getItem, setItem } from '@/lib/storage/secureStore';
import { todayISO } from '@/lib/data/mappers';
import { api } from '@/lib/api';

const SRC = path.join(__dirname, '..');
const read = (rel: string): string => fs.readFileSync(path.join(SRC, rel), 'utf8');

/** Assert `first` appears before `second` in `src` (both must appear). */
function ordered(src: string, first: string, second: string, what: string): void {
  const a = src.indexOf(first);
  const b = src.indexOf(second);
  if (a < 0) throw new Error(`${what}: missing ${JSON.stringify(first)}`);
  if (b < 0) throw new Error(`${what}: missing ${JSON.stringify(second)}`);
  expect(a).toBeLessThan(b);
}

// ---------------------------------------------------------------------------
// Claim 1 — account deletion (client half)
// ---------------------------------------------------------------------------

describe('claim 1 · account deletion', () => {
  test('the delete screen deletes server-side FIRST, then dispatches ACCOUNT_DELETED', () => {
    const src = read('app/profile/delete-account.tsx');
    ordered(src, 'await api.profile.delete()', "dispatch({ type: 'ACCOUNT_DELETED' })", 'delete-account');
    // The dispatch is on the success path only: the catch branch shows a toast
    // and re-enables the button instead of purging local state.
    const catchBlock = src.slice(src.indexOf('} catch'));
    expect(catchBlock).not.toContain('ACCOUNT_DELETED');
    expect(catchBlock).toContain('setDeleting(false)');
  });

  test('ACCOUNT_DELETED purges every store and blocks cached-data hydration', () => {
    const t = transition('signedIn', { type: 'ACCOUNT_DELETED' });
    expect(t.state).toBe('deleted');
    expect(t.effects).toEqual(expect.arrayContaining(['purgeAllState', 'route:onboarding']));
    expect(mayHydrateCachedData(t.state)).toBe(false);
    // The Clerk-session teardown that follows arrives as SIGN_OUT; it must not
    // bounce the user out of the deleted lane.
    expect(transition('deleted', { type: 'SIGN_OUT' }).state).toBe('deleted');
  });

  test('the purge clears stores, the offline queue, the analytics buffer and the AI-consent key', async () => {
    useFoodStore.getState().logMeal(
      'Lunch',
      { name: 'Deleted account meal', quantityG: 100, calories: 500, protein: 1, carbs: 1, fat: 1 },
      'manual',
    );
    useUserStore.getState().setProfile({ name: 'Deleted Person' });
    useSettingsStore.getState().setCustomGoals({ calories: 2345 });
    useSettingsStore.getState().setGoalMode('custom');
    useOnboardingStore.getState().setGoal('muscle');
    await enqueue('/api/food/logs', { food_name: 'Queued after deletion' });
    track('food_logged', { method: 'manual' });
    await setItem(AI_CONSENT_KEY, '1');
    __resetAiConsentCache();
    expect(await hasAiConsent()).toBe(true);

    await resetAllStores();

    expect(JSON.stringify(useFoodStore.getState().meals)).not.toContain('Deleted account meal');
    expect(useUserStore.getState().profile.name).not.toBe('Deleted Person');
    expect(useSettingsStore.getState().goalMode).toBe('ai');
    expect(useSettingsStore.getState().customGoals.calories).not.toBe(2345);
    expect(useOnboardingStore.getState().goal).toBeNull();
    expect(pendingCount()).toBe(0);
    await loadQueue();
    expect(pendingCount()).toBe(0);
    expect(analyticsPending()).toBe(0);
    // AI consent: persisted key gone AND the in-memory cache forgotten, so the
    // next account on this device re-acknowledges.
    expect(await getItem(AI_CONSENT_KEY)).toBeNull();
    expect(await hasAiConsent()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Claim 2 — calorie safety band (client half; server half in the Go file)
// ---------------------------------------------------------------------------

describe('claim 2 · calorie banding', () => {
  test('clampCalories holds the [1200, 10000] band and rounds', () => {
    expect(CALORIE_TARGET_MIN).toBe(1200);
    expect(CALORIE_TARGET_MAX).toBe(10000);
    expect(clampCalories(0)).toBe(1200);
    expect(clampCalories(-500)).toBe(1200);
    expect(clampCalories(1199)).toBe(1200);
    expect(clampCalories(1200)).toBe(1200);
    expect(clampCalories(2000.4)).toBe(2000);
    expect(clampCalories(10000)).toBe(10000);
    expect(clampCalories(10001)).toBe(10000);
    expect(clampCalories(999999)).toBe(10000);
  });

  test('the settings store never stores an out-of-band custom target', () => {
    useSettingsStore.getState().setCustomGoals({ calories: 300 });
    expect(useSettingsStore.getState().customGoals.calories).toBe(1200);
    useSettingsStore.getState().setCustomGoals({ calories: 42000 });
    expect(useSettingsStore.getState().customGoals.calories).toBe(10000);
    // Other macros pass through untouched.
    useSettingsStore.getState().setCustomGoals({ protein: 180 });
    expect(useSettingsStore.getState().customGoals.protein).toBe(180);
    expect(useSettingsStore.getState().customGoals.calories).toBe(10000);
    useSettingsStore.getState().reset();
  });

  test('the onboarding targets sheet clamps the manual value before saving', () => {
    const src = read('app/onboarding/targets.tsx');
    expect(src).toContain("import { clampCalories } from '@/lib/settings/store'");
    // The saved value is the clamped one, in both the local state and the store.
    expect(src).toContain('const calories = clampCalories(parseNum(draft, macros.calories))');
    ordered(src, 'const calories = clampCalories(', 'setCalorieTarget(calories)', 'targets sheet');
  });
});

// ---------------------------------------------------------------------------
// Claim 3 — third-party-AI consent gating
// ---------------------------------------------------------------------------

describe('claim 3 · third-party-AI consent', () => {
  test('consent is false until the key is set, and the key is cleared on sign-out', async () => {
    __resetAiConsentCache();
    expect(await hasAiConsent()).toBe(false);
    await setItem(AI_CONSENT_KEY, '1');
    __resetAiConsentCache();
    expect(await hasAiConsent()).toBe(true);
    await resetAllStores();
    expect(await getItem(AI_CONSENT_KEY)).toBeNull();
    expect(await hasAiConsent()).toBe(false);
  });

  test('the AI-consent key is in the sign-out purge list', () => {
    expect(read('lib/auth/resetRegistry.ts')).toContain('AI_CONSENT_KEY');
  });

  test('photo capture asks for consent before any frame is taken or uploaded', () => {
    const src = read('app/food/photo-capture.tsx');
    ordered(src, 'if (!(await ensureAiConsent())) return;', 'takePictureAsync', 'photo-capture');
    // Nothing is enqueued for upload ahead of the guard either.
    ordered(src, 'if (!(await ensureAiConsent())) return;', 'setShots(', 'photo-capture');
  });

  test('label scan asks for consent before capture', () => {
    const src = read('app/food/label-scan.tsx');
    expect(src).toContain('if (!(await ensureAiConsent())) return;');
    ordered(src, 'if (!(await ensureAiConsent())) return;', 'takePictureAsync', 'label-scan');
  });

  test('Ask Lume asks for consent before sending the question', () => {
    const src = read('app/ai-query.tsx');
    ordered(src, 'if (!(await ensureAiConsent())) return;', 'await ask(q)', 'ai-query');
  });

  test('the insights screen renders nothing (and fetches nothing) before consent', () => {
    const src = read('app/insights.tsx');
    expect(src).toContain('void ensureAiConsent().then');
    // The fetching component is only mounted once consent is granted.
    expect(src).toContain('if (!granted)');
    ordered(src, 'if (!granted)', '<InsightsInner />', 'insights');
  });

  // DISCREPANCY (documented, not asserted as desired): the Food tab mounts
  // AnomalyBanner, which calls useInsights() → GET /api/ai/insights (+ the
  // routeless /api/ai/anomalies) with NO consent gate. Those two are pure DB
  // reads server-side (ai.listInsights only calls Store.ListInsights; there is
  // no /api/ai/anomalies route at all), so no personal data reaches a third
  // party before consent — the privacy substance of 5.1.2(i) holds. But the
  // comment in app/insights.tsx justifying its gate ("the feed's GET can
  // trigger Anthropic generation server-side") is FALSE: only
  // /api/ai/morning-brief and /api/ai/query call the LLM, and both are gated.
  // This test pins the real wiring so a future change that makes listInsights
  // generate (and thus leak pre-consent) fails here.
  test('actual behaviour: the Food-tab anomaly banner fetches insights ungated', () => {
    expect(read('app/(tabs)/food.tsx')).toContain('<AnomalyBanner');
    const banner = read('components/ai/AnomalyBanner.tsx');
    expect(banner).toContain('useInsights()');
    expect(banner).not.toContain('AiConsent');
    const brain = read('lib/data/aiBrain.ts');
    // useInsights has no consent gate today…
    const useInsightsBody = brain.slice(brain.indexOf('export function useInsights'), brain.indexOf('export function useBrainProfile'));
    expect(useInsightsBody).not.toContain('hasAiConsent');
    // …and that is only acceptable while these endpoints stay DB-only reads.
    expect(useInsightsBody).toContain('api.ai.getInsights()');
  });

  test('the morning brief fetches nothing before consent', () => {
    const src = read('lib/data/aiBrain.ts');
    // Asserted by behaviour, not by the exact import line — the module also
    // imports ensureAiConsent now (to re-prompt on the server's 403), and the
    // two share one import statement.
    expect(src).toMatch(/import \{[^}]*\bhasAiConsent\b[^}]*\} from '@\/lib\/ai\/consent'/);
    ordered(src, 'hasAiConsent()', 'api.ai.getMorningBrief()', 'useMorningBrief');
    expect(src).toContain('if (!ok || !active) return null;');
  });
});

// ---------------------------------------------------------------------------
// Claim 5 — timezone anchoring (client half)
// ---------------------------------------------------------------------------

describe('claim 5 · timezone anchoring', () => {
  test('todayISO is the DEVICE-local calendar date, not the UTC one', () => {
    const d = new Date();
    const localExpected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(todayISO()).toBe(localExpected);
    // Derived from the local getters — a toISOString() slice would be UTC and
    // would put a 23:50 meal on the wrong day west of Greenwich.
    expect(read('lib/data/mappers.ts')).toContain('d.getFullYear()');
  });

  test('both energy hooks anchor their request on the local date', () => {
    const src = read('lib/data/energy.ts');
    expect(src).toContain('const day = date ?? todayISO();');
    expect(src).toContain('api.energy.getBalance(day)');
    expect(src).toContain('const end = todayISO();');
    expect(src).toContain('api.energy.getWeek(end)');
  });

  test('the client sends the local date as ?date= and ?end=', async () => {
    const calls: string[] = [];
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) => {
      calls.push(url);
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: {}, error: null }) });
    });
    const local = todayISO();
    await api.energy.getBalance(local);
    await api.energy.getWeek(local);
    expect(calls[0]).toContain(`/api/energy-balance?date=${local}`);
    expect(calls[1]).toContain(`/api/energy-balance/week?end=${local}`);
  });
});
