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

import { router } from 'expo-router';

import { useGymStore } from '@/lib/data/gymStore';
import StreakDetailScreen from '@/app/gym/streak';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './helpers';

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
  total_days: 23,
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

describe('Fix 18: the freezes figure opens the freeze sheet', () => {
  const renderWith = async (freezeUsed: boolean) => {
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
      url.includes('/api/gym/streak') ? json({ ...STREAK, freeze_used: freezeUsed }) : json([]),
    );
    const tree = renderScreen(
      <SafeAreaProvider initialMetrics={METRICS}>
        <StreakDetailScreen />
      </SafeAreaProvider>,
    );
    await settle();
    return tree;
  };
  const freezes = (tree: Awaited<ReturnType<typeof renderWith>>) =>
    findAll(tree, (p) => typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.startsWith(en.profile.freezes) && typeof p.onPress === 'function')[0];

  beforeEach(() => jest.mocked(router.push).mockClear());

  test('1 freeze: no reason shown, and tapping opens /gym/freeze', async () => {
    const tree = await renderWith(false);
    expect(allText(tree)).not.toContain(en.gymStreak.noFreezes);
    expect(freezes(tree).props.accessibilityLabel).toBe(`${en.profile.freezes}, 1`);
    act(() => (freezes(tree).props.onPress as () => void)());
    expect(router.push).toHaveBeenCalledWith('/gym/freeze');
  });

  test('0 freezes: the reason shows under the figures, and it still opens /gym/freeze', async () => {
    const tree = await renderWith(true);
    expect(allText(tree)).toContain(en.gymStreak.noFreezes);
    expect(freezes(tree).props.accessibilityLabel).toBe(`${en.profile.freezes}, 0. ${en.gymStreak.noFreezes}`);
    act(() => (freezes(tree).props.onPress as () => void)());
    expect(router.push).toHaveBeenCalledWith('/gym/freeze');
  });
});
