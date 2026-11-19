// Goals screen (PHASE2_ROWS.md row 13).
//
// useEffectiveGoals() used to never call the real, fully-implemented
// GET /api/goals — it derived a target locally even when the server already
// had the user's own saved row. This pins the fix: with a server goals row,
// the screen shows THAT row's calorie figure, not the locally derived one;
// with no server row (404 — no onboarding completed), it falls back to the
// local derivation instead of crashing or showing a stale/fabricated number.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/lib/settings/store';
import { useUserStore } from '@/lib/data/userStore';
import GoalsScreen from '@/app/profile/goals';
import { act, allText, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const json = (data: unknown, status = 200) =>
  Promise.resolve({ ok: status < 300, status, json: async () => ({ data, error: status < 300 ? null : 'error' }) });

// Clearly not a number deriveGoals() would ever produce for this profile —
// if this shows up, the screen is reading the server row, not deriving one.
const SERVER_GOALS = {
  id: 'g1',
  user_id: 'u1',
  calorie_target: 2222,
  protein_target: 150,
  carb_target: 220,
  fat_target: 70,
  fibre_target: 30,
  weight_goal: 'lose',
  target_weight: 80,
  weight_unit: 'kg',
  activity_level: 'moderate',
  source: 'onboarding',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const PROFILE = {
  weightKg: 82,
  heightCm: 178,
  age: 30,
  sex: 'male' as const,
  activityLevel: 'moderate' as const,
  goal: 'lose' as const,
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  useSettingsStore.getState().reset();
  useUserStore.getState().setProfile(PROFILE);
});

test('shows the server goals row, not the locally derived target', async () => {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
    url.includes('/api/goals') ? json(SERVER_GOALS) : json({}),
  );

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GoalsScreen />
    </SafeAreaProvider>,
  );
  await settle();

  const text = allText(tree);
  expect(text).toContain('2222');
});

test('falls back to the local derivation, not a crash or a stale number, when the server has no goals row', async () => {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
    url.includes('/api/goals') ? json(null, 404) : json({}),
  );

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GoalsScreen />
    </SafeAreaProvider>,
  );
  await settle();

  const text = allText(tree);
  // The server sentinel must never appear when the server had nothing to say.
  expect(text).not.toContain('2222');
  // Some real calorie figure still renders (the local derivation, not a crash).
  expect(text).toMatch(/"value":"\d+"/);
});
