// Gym streak detail (PHASE2_ROWS.md row 12).
//
// The screen used to render a "Next 7 days" list of invented log/freeze/
// scheduled suggestions (mockUpcomingDays) — fixed literal dates with no
// backend behind them. No /api/gym route returns upcoming days, so the list
// was removed rather than wired to anything real. This pins that: with real
// (or absent) server data, nothing fabricated reaches the screen.
//
// StreakCounter renders StreakFlame, which animates through reanimated's
// useReducedMotion — not provided by this render environment (same gap noted
// in energyBalanceCard.render.test.tsx). Nothing here checks the flame, so a
// plain stand-in is enough. (jest.mock is hoisted above the imports.)
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { useGymStore } from '@/lib/data/gymStore';
import StreakDetailScreen from '@/app/gym/streak';
import { act, allText, renderScreen } from './helpers';

jest.mock('@/components/domain/StreakCounter', () => ({
  StreakCounter: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });

const STREAK = {
  current_streak: 5,
  longest_streak: 9,
  last_gym_date: '2026-09-12',
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
    return json([]);
  });
});

test('shows only the real streak numbers, never an invented upcoming-days list', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <StreakDetailScreen />
    </SafeAreaProvider>,
  );
  await settle();

  const text = allText(tree);
  // The old fabricated rows: fixed literal dates and a made-up section header.
  expect(text).not.toContain('Next 7 days');
  expect(text).not.toContain('Wed 18 Jun');
  expect(text).not.toContain('Thu 19 Jun');
  expect(text).not.toContain('Fri 20 Jun');
  expect(text).not.toContain('Sat 21 Jun');
  expect(text).not.toContain('Sun 22 Jun');

  // The real numbers the server returned still render.
  expect(text).toContain('9'); // longest
});

test('renders the same with no server data at all — nothing invented to fill the gap', async () => {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() => json([]));
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <StreakDetailScreen />
    </SafeAreaProvider>,
  );
  await settle();

  const text = allText(tree);
  expect(text).not.toContain('Next 7 days');
  expect(text).not.toContain('Tomorrow');
});
