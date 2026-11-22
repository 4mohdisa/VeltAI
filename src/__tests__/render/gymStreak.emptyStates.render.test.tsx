// PHASE3_ROWS.md row 14, Gym streak detail (src/app/gym/streak.tsx) states.
// Mounts the real screen with fetch stubbed, so the real useGym hydration runs.
// The store starts with no streak and no sessions (a dev build seeds mock data
// on reset). A failed read shows the LoadFailedNotice and its Retry re-runs the
// read; a successful read with no streak shows the empty state; the copy is
// read from en.json.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import StreakDetailScreen from '@/app/gym/streak';
import { useGymStore } from '@/lib/data/gymStore';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/components/domain/StreakCounter', () => ({ StreakCounter: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });
// A 4xx is not retried (src/lib/api.ts retries only network errors and 5xx), so the failure lands at once.
const failed = () => Promise.resolve({ ok: false, status: 400, json: async () => ({ data: null, error: 'Bad request' }) });

const NO_STREAK = { current_streak: 0, longest_streak: 0, last_gym_date: null, freeze_used: false, last_freeze_date: null };

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

let fetchMock: jest.Mock;

/** Mounts the screen with /api/gym/streak answering `streakResponse`; sessions read as []. */
async function renderStreak(streakResponse: () => Promise<unknown>) {
  fetchMock = jest.fn((url: string) => (url.includes('/api/gym/streak') ? streakResponse() : json([])));
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <StreakDetailScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderStreak>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
const streakCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/gym/streak')).length;

beforeEach(() => {
  useGymStore.getState().reset();
  useGymStore.setState({
    sessions: [],
    streak: { current: 0, longest: 0, totalGymDays: 0, freezesAvailable: 0, gymLoggedToday: false },
  });
});

test('a successful read with no streak shows the empty state and one log action', async () => {
  const tree = await renderStreak(() => json(NO_STREAK));

  expect(hasText(tree, en.gymStreak.emptyTitle)).toBe(true);
  expect(hasText(tree, en.gymStreak.emptyMessage)).toBe(true);
  expect(findAll(tree, (p) => p.title === en.addMenu.logGymSession).length).toBeGreaterThan(0);
  expect(hasText(tree, en.profile.streak)).toBe(true);
  expect(hasText(tree, en.gym.loadFailed)).toBe(false);
});

test('a failed read with no streak shows the load failure and Retry runs the read again', async () => {
  const tree = await renderStreak(failed);

  expect(hasText(tree, en.gym.loadFailed)).toBe(true);
  expect(hasText(tree, en.gymStreak.emptyTitle)).toBe(false);
  const before = streakCalls();
  expect(before).toBeGreaterThan(0);

  const retry = findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain && typeof p.onPress === 'function')[0];
  expect(retry).toBeDefined();
  await act(async () => {
    (retry.props.onPress as () => void)();
  });
  await settle();
  expect(streakCalls()).toBeGreaterThan(before);
});

test('a real streak shows the stat labels from en.json', async () => {
  const tree = await renderStreak(() =>
    json({ current_streak: 3, longest_streak: 6, last_gym_date: '2026-11-20', freeze_used: false, last_freeze_date: null }),
  );

  expect(hasText(tree, en.profile.longest)).toBe(true);
  expect(hasText(tree, en.gymStreak.sessions)).toBe(true);
  expect(hasText(tree, en.profile.freezes)).toBe(true);
  expect(hasText(tree, en.gymStreak.emptyTitle)).toBe(false);
});
