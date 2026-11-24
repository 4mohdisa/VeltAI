// Summary tab (PHASE2_ROWS.md row 16) — the actual screen, not just its hook.
//
// summaryHydration.render.test.tsx already pins that useDashboard() fetches on
// mount. This mounts the real screen (src/app/(tabs)/index.tsx) and checks the
// OTHER two reads it owns — the 7-day energy window (EnergyBalanceCard /
// WeekEnergyCard) and the 7-day gym range (WorkoutsWeekCard / GymStatusCard) —
// actually reach the cards, so Summary never shows a seed or a blank where a
// real server number belongs.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import type { ReactTestRenderer } from 'react-test-renderer';

import { useGymStore } from '@/lib/data/gymStore';
import { useFoodStore } from '@/lib/data/foodStore';
import { todayISO } from '@/lib/data/mappers';
import DashboardScreen from '@/app/(tabs)/index';
import { act, renderScreen } from './helpers';

// This screen's ScrollView carries a `refreshControl` element, which is never
// rendered to a host node of its own — react-test-renderer leaves it as the
// raw React element (fiber and all) on the ScrollView's props, and that fiber
// is circular. helpers.tsx's allText (plain JSON.stringify) chokes on it, a
// problem the other render tests never hit since none of them mount a
// scroll+pull-to-refresh screen. Nothing here asserts on refreshControl, so
// this file's own text collector just drops that one prop.
function allTextSafe(tree: ReactTestRenderer): string {
  return JSON.stringify(tree.toJSON(), (key, value) => (key === 'refreshControl' ? undefined : value));
}

// Skeleton and StreakFlame both animate through reanimated's useReducedMotion,
// which this render environment does not provide (same gap noted in
// energyBalanceCard.render.test.tsx / gymStreak.render.test.tsx) — plain
// stand-ins are enough since nothing here asserts on either.
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));
jest.mock('@/components/display/StreakFlame', () => ({
  StreakFlame: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });

const today = todayISO();

const STREAK = {
  current_streak: 11,
  longest_streak: 11,
  total_days: 11,
  last_gym_date: today,
  freeze_used: false,
  last_freeze_date: null,
};

const SESSIONS = [
  { id: 's1', user_id: 'u1', date: today, name: 'Push day', notes: null, duration_minutes: 42, created_at: today },
];

const WEEK = {
  days: [
    { date: today, calories_in: 1500, calories_out_bmr: 1600, calories_out_exercise: 200, calories_out_total: 1800, net_balance: -300, target: 2000, variance: -500, status: 'deficit' },
  ],
  weekly_average_in: 1500,
  weekly_average_out: 1800,
  weekly_net: -300,
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  useGymStore.getState().reset();
  useFoodStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) => {
    if (url.includes('/api/energy-balance/week')) return json(WEEK);
    if (url.includes('/api/gym/streak')) return json(STREAK);
    if (url.includes('/api/gym/sessions')) return json(SESSIONS);
    if (url.includes('/api/food/logs')) return json([]);
    if (url.includes('/api/profile')) return json({ id: 'u1', email: 'a@b.c', display_name: 'Test', avatar_url: null });
    return json([]);
  });
});

test('Summary renders the real energy window, gym streak and today session — nothing fabricated', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <DashboardScreen />
    </SafeAreaProvider>,
  );
  await settle();
  await settle();

  const text = allTextSafe(tree);

  // Energy balance card: today's row from the 7-day window.
  expect(text).toContain('1,500');
  expect(text).toContain('deficit');

  // Streak line: the server's own count, not the store's seed.
  expect(text).toContain('11 day streak');

  // Today's gym session, hydrated from the range read — both the one-tap
  // card (useGymStore, via hydrateGym) and Workouts (useGymRange(7)).
  expect(text).toContain('Logged today');
  expect(text).toContain('42 min');
  expect(text).toContain('0h 42m trained');
});
