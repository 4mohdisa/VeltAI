// Gym tab streak strip footnote (PHASE2_ROWS.md row 35 — "Visual QA: streak",
// Phase 1 device item "streak footnote at 320pt width"): the right-aligned
// "N sessions · M freezes" line in src/app/(tabs)/gym.tsx must still show its
// full sentence at a 320pt-wide device (iPhone SE) — no numberOfLines
// truncation — and must be allowed to shrink/wrap rather than overflow past
// the card edge.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import type { ReactTestRenderer } from 'react-test-renderer';

import { useGymStore } from '@/lib/data/gymStore';
import GymLogScreen from '@/app/(tabs)/gym';
import { categoryAccent } from '@/lib/design/tokens';
import { act, findAll, renderScreen } from './helpers';

// Skeleton animates through reanimated's useReducedMotion, not provided by
// this render environment (same gap noted in dashboardSummary.render.test.tsx
// / gymStreak.render.test.tsx) — the loading placeholders this screen's cards
// show aren't what this test checks, so a plain stand-in is enough.
jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

// The shared expo-router mock (render/setup.ts) has no useFocusEffect — this
// screen is the first render test to need one, to re-read the month on focus.
// Same router/useLocalSearchParams shape as the shared mock, plus a stand-in
// that just runs the effect once on mount (test-renderer never "focuses").
// require(), not an import: jest.mock()'s factory cannot close over them.
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
  usePathname: () => '/(tabs)/gym',
  Href: {},
}));

// Same circular-ref gap as dashboardSummary.render.test.tsx: this screen's
// ScrollView carries a refreshControl element that plain JSON.stringify
// chokes on. Nothing here asserts on refreshControl, so drop that one prop.
function allTextSafe(tree: ReactTestRenderer): string {
  return JSON.stringify(tree.toJSON(), (key, value) => (key === 'refreshControl' ? undefined : value));
}

const METRICS_320: Metrics = {
  frame: { x: 0, y: 0, width: 320, height: 568 },
  insets: { top: 20, left: 0, right: 0, bottom: 0 },
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });

const STREAK = {
  current_streak: 12,
  longest_streak: 20,
  last_gym_date: '2026-11-19',
  freeze_used: false,
  last_freeze_date: null,
};

// A planned (not yet logged) workout for "today" — gym.tsx:174 reads this
// object's own `exercises` array directly. The fallback branch below used to
// answer /api/gym/today with `json([])`, an empty ARRAY standing in for a
// TodayWorkout object; `[] && [].exercises.length` threw, a crash this file's
// fixed clock below used to mask by keeping gymLoggedToday (and so the whole
// `!gymLoggedToday && …` expression) false every real day it happened to run on.
const TODAY_WORKOUT = {
  day_of_week: 5,
  day_name: 'Friday',
  is_rest_day: false,
  template: {
    id: 'tmpl1',
    user_id: 'u1',
    name: 'Push day',
    estimated_duration_minutes: 45,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    exercises: [],
  },
  exercises: [
    {
      id: 'te1',
      template_id: 'tmpl1',
      exercise_id: 'ex1',
      planned_sets: 3,
      planned_reps: 10,
      planned_weight: 40,
      planned_weight_unit: 'kg',
      planned_duration_minutes: null,
      rest_seconds: 60,
      sort_order: 0,
      created_at: '2026-11-01T00:00:00Z',
    },
  ],
  already_checked_in: false,
  session_id: null,
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

// mappers.ts's gymLoggedToday compares STREAK.last_gym_date against the REAL
// clock (todayISO()) — unpinned, this test's outcome silently depended on
// which real day it ran. Fixed to the day after last_gym_date, so
// gymLoggedToday is deterministically false and the GymSessionButton branch
// at gym.tsx:174 is actually exercised rather than short-circuited away.
// `setImmediate` stays real: settle() below needs it to flush the mocked
// fetch's promise chain, which a faked one would never auto-advance.
jest.useFakeTimers({ doNotFake: ['setImmediate'] }).setSystemTime(new Date(2026, 10, 20, 9, 0, 0));

beforeEach(() => {
  useGymStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) => {
    if (url.includes('/api/gym/streak')) return json(STREAK);
    if (url.includes('/api/gym/sessions')) return json([]);
    if (url.includes('/api/gym/patterns')) return json(null); // GymPatternsCard's "no data" shape
    if (url.includes('/api/gym/today')) return json(TODAY_WORKOUT);
    return json([]);
  });
});

test('at 320pt, the streak strip footnote keeps its full sentence and can wrap instead of overflow', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS_320}>
      <GymLogScreen />
    </SafeAreaProvider>,
  );
  await settle();
  await settle();

  // The full sentence reached the screen — not a `numberOfLines`-style cut.
  expect(allTextSafe(tree)).toMatch(/\d+ (session|sessions) · \d+ (freeze|freezes)/);

  const footnote = findAll(
    tree,
    (p) => p.variant === 'footnote' && typeof p.children === 'string' && /sessions? · \d+ freezes?/.test(p.children as string),
  )[0];
  expect(footnote).toBeDefined();
  // No line cap: a long count never gets an ellipsis instead of wrapping.
  expect(footnote.props.numberOfLines).toBeUndefined();
  // flexShrink lets the row give it space back from the fixed-width siblings
  // instead of pushing it past the card's right edge at the narrowest width.
  expect(footnote.props.style).toMatchObject({ flexShrink: 1 });

  // PHASE2_ROWS.md row 54 ("streak strip and flame"): the flame itself is an
  // Svg Path, not text, so it needs its own structural check — the footnote
  // assertions above never touch it.
  const flame = findAll(tree, (p) => p.fill === categoryAccent.streak && typeof p.d === 'string')[0];
  expect(flame).toBeDefined();
});
