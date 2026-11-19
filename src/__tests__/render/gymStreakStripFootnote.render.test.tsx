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

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  useGymStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) => {
    if (url.includes('/api/gym/streak')) return json(STREAK);
    if (url.includes('/api/gym/sessions')) return json([]);
    if (url.includes('/api/gym/patterns')) return json(null); // GymPatternsCard's "no data" shape
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
});
