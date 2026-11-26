// Fix 20 (DESIGN_INTENT.md), the one-week rule, on the Training detail
// (src/app/dashboard/training.tsx). Its week figures (sessions this week and the
// Breakdown rows) count this calendar week, Monday to today, through weekOf: the
// week Summary Workouts counts. They used to take the last 7 days of the range,
// which reaches into last week on every day but Sunday. Only Date is faked, so
// the settle helper's setImmediate still runs. @/lib/api is mocked at the
// boundary, as in dashboardTraining.emptyStates.render.test.tsx.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TrainingDetailScreen from '@/app/dashboard/training';
import { BreakdownRow } from '@/components/display/DetailChart';
import type { GymSession } from '@/lib/api';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

const mockListSessions = jest.fn();
const mockGetWeek = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: { listSessions: (...args: unknown[]) => mockListSessions(...args) },
    energy: { getWeek: (...args: unknown[]) => mockGetWeek(...args) },
  },
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonCard: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const session = (id: string, date: string): GymSession => ({
  id,
  user_id: 'u1',
  date,
  name: 'Push day',
  notes: null,
  duration_minutes: 40,
  created_at: `${date}T09:00:00Z`,
});

// Sat 21 and Sun 22 Nov 2026 are last week; Mon 23 and Wed 25 are this week.
const SESSIONS = [session('s1', '2026-11-21'), session('s2', '2026-11-22'), session('s3', '2026-11-23'), session('s4', '2026-11-25')];

const renderOn = async (now: string) => {
  jest.useFakeTimers({ now: new Date(now), doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval', 'queueMicrotask'] });
  mockListSessions.mockResolvedValue(SESSIONS);
  mockGetWeek.mockResolvedValue({ days: [] });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TrainingDetailScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
};

type Tree = Awaited<ReturnType<typeof renderOn>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
const breakdownRows = (tree: Tree) => tree.root.findAllByType(BreakdownRow);

afterEach(() => jest.useRealTimers());

test('on a Wednesday the week is Monday to today, so last weekend is not counted', async () => {
  const tree = await renderOn('2026-11-25T12:00:00');
  // The last 7 days (19 to 25 Nov) hold four sessions; this week holds two.
  expect(hasText(tree, '2')).toBe(true);
  expect(hasText(tree, en.dashboard.sessionsThisWeek_other)).toBe(true);
  expect(breakdownRows(tree)).toHaveLength(3);
});

test('on a Monday the week is that day alone, even with sessions on the days before', async () => {
  const tree = await renderOn('2026-11-23T12:00:00');
  expect(hasText(tree, '1')).toBe(true);
  expect(hasText(tree, en.dashboard.sessionsThisWeek_one)).toBe(true);
  expect(breakdownRows(tree)).toHaveLength(1);
});
