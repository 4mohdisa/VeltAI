// PHASE3_ROWS.md row 14, Gym session history (src/app/gym/history.tsx) states.
// @/lib/api is mocked at the same boundary as gymHistory.render.test.tsx, so the
// real useGym hydration runs. A failed read with nothing stored shows the
// LoadFailedNotice and its Retry re-runs the read; a successful empty read shows
// the empty state; the copy is read from en.json, then checked in Spanish.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import GymHistoryScreen from '@/app/gym/history';
import { useGymStore } from '@/lib/data/gymStore';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

const mockListSessions = jest.fn();
const mockStreak = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: {
      listSessions: (...args: unknown[]) => mockListSessions(...args),
      streak: (...args: unknown[]) => mockStreak(...args),
    },
  },
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({ SkeletonList: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const STREAK = { current_streak: 0, longest_streak: 0, last_gym_date: null, freeze_used: false, last_freeze_date: null };

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

async function renderHistory() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <GymHistoryScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderHistory>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;

beforeEach(() => {
  useGymStore.getState().reset();
  mockListSessions.mockReset();
  mockStreak.mockReset();
  mockStreak.mockResolvedValue(STREAK);
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('a failed read with no sessions shows the load failure and Retry runs the read again', async () => {
  mockListSessions.mockRejectedValue(new Error('Network request failed'));
  // A dev build seeds mock sessions on reset; release starts empty, which is the case under test.
  useGymStore.setState({ sessions: [] });
  const tree = await renderHistory();

  expect(hasText(tree, en.gym.loadFailed)).toBe(true);
  expect(hasText(tree, en.dashboard.trainingNoSessionsTitle)).toBe(false);
  expect(mockListSessions).toHaveBeenCalledTimes(1);

  const retry = findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain && typeof p.onPress === 'function')[0];
  expect(retry).toBeDefined();
  await act(async () => {
    (retry.props.onPress as () => void)();
  });
  await settle();
  expect(mockListSessions).toHaveBeenCalledTimes(2);
});

test('a successful read with no sessions shows the empty state', async () => {
  mockListSessions.mockResolvedValue([]);
  const tree = await renderHistory();

  expect(hasText(tree, en.dashboard.trainingNoSessionsTitle)).toBe(true);
  expect(hasText(tree, en.gymHistory.emptyMessage)).toBe(true);
  expect(hasText(tree, en.gym.loadFailed)).toBe(false);
});

test('Spanish: the empty state and a row with no duration read from es.json', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  mockListSessions.mockResolvedValue([]);
  const empty = await renderHistory();
  expect(hasText(empty, es.gymHistory.emptyMessage)).toBe(true);

  mockListSessions.mockResolvedValue([
    { id: 's1', user_id: 'u1', date: '2026-11-13', name: 'Legs', notes: null, duration_minutes: null, created_at: '2026-11-13T09:00:00Z' },
  ]);
  const withRow = await renderHistory();
  expect(findAll(withRow, (p) => Array.isArray(p.children) && p.children.includes(es.gymHistory.durationNotRecorded)).length).toBeGreaterThan(0);
});
