// PHASE3_ROWS.md row 14, Gym streak freeze sheet (src/app/gym/freeze.tsx) states.
// Mounts the real screen with fetch stubbed, so the real useGym hydration runs.
// The store starts with no streak and no sessions (a dev build seeds mock data
// on reset). With no streak to protect, the empty state shows; a failed read
// shows the LoadFailedNotice and its Retry re-runs the read; a real streak shows
// the confirm copy. All copy is read from en.json.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FreezeScreen from '@/app/gym/freeze';
import { useGymStore } from '@/lib/data/gymStore';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });
// A 4xx is not retried (src/lib/api.ts retries only network errors and 5xx), so the failure lands at once.
const failed = () => Promise.resolve({ ok: false, status: 400, json: async () => ({ data: null, error: 'Bad request' }) });

const NO_STREAK = { current_streak: 0, longest_streak: 0, last_gym_date: null, freeze_used: false, last_freeze_date: null, total_days: 0 };

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

let fetchMock: jest.Mock;

/** Mounts the sheet with /api/gym/streak answering `streakResponse`; sessions read as []. */
async function renderFreeze(streakResponse: () => Promise<unknown>) {
  fetchMock = jest.fn((url: string) => (url.includes('/api/gym/streak') ? streakResponse() : json([])));
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FreezeScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderFreeze>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
const streakCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/gym/streak')).length;

beforeEach(() => {
  useGymStore.getState().reset();
  useGymStore.setState({
    sessions: [],
    frozenDates: [],
    streak: { current: 0, longest: 0, totalGymDays: 0, freezesAvailable: 0, gymLoggedToday: false },
  });
});

test('with no streak to protect, the empty state shows its copy from en.json', async () => {
  const tree = await renderFreeze(() => json(NO_STREAK));

  expect(hasText(tree, en.gymFreeze.emptyTitle)).toBe(true);
  expect(hasText(tree, en.gymFreeze.emptyMessage)).toBe(true);
  expect(findAll(tree, (p) => p.title === en.addMenu.logGymSession).length).toBeGreaterThan(0);
  expect(hasText(tree, en.gym.loadFailed)).toBe(false);
});

test('a failed read with no streak shows the load failure and Retry runs the read again', async () => {
  const tree = await renderFreeze(failed);

  expect(hasText(tree, en.gym.loadFailed)).toBe(true);
  expect(hasText(tree, en.gymFreeze.emptyTitle)).toBe(false);
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

test('a real streak shows the sheet title and confirm copy from en.json', async () => {
  const tree = await renderFreeze(() =>
    json({ current_streak: 4, longest_streak: 4, last_gym_date: '2026-11-20', freeze_used: false, last_freeze_date: null, total_days: 9 }),
  );

  expect(hasText(tree, en.gym.freeze.title)).toBe(true);
  expect(hasText(tree, en.gym.freeze.confirm.replace('{{available}}', '1'))).toBe(true);
  expect(hasText(tree, en.gymFreeze.emptyTitle)).toBe(false);
});
