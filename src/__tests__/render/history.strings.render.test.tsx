// PHASE3_ROWS.md row 13, Meal history screen (src/app/food/history.tsx) strings.
// The screen reads the api directly (no data hook), so the two calls it makes
// are mocked: a failed day summary must show ErrorState with history.loadFailed
// from en.json, not a hardcoded English line. The empty state, the Yesterday
// label and the gym row labels are read from en.json the same way.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MealHistoryScreen from '@/app/food/history';
import { api } from '@/lib/api';
import { GYM_SESSION_HYDRATE_LIMIT } from '@/lib/data/hooks';
import { formatCalories } from '@/lib/formatting';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    api: {
      ...actual.api,
      gym: { listSessions: jest.fn() },
      foodLogs: { summary: jest.fn() },
    },
  };
});

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

test('a failed history read shows the history.loadFailed copy from en.json', async () => {
  (api.gym.listSessions as jest.Mock).mockResolvedValue([]);
  (api.foodLogs.summary as jest.Mock).mockRejectedValue(new Error('Network request failed'));

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MealHistoryScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  expect(api.gym.listSessions).toHaveBeenCalledWith({ limit: GYM_SESSION_HYDRATE_LIMIT });
  expect(findAll(tree, (p) => p.children === en.history.loadFailed).length).toBeGreaterThan(0);
  expect(findAll(tree, (p) => p.children === en.history.emptyTitle)).toHaveLength(0);
});

/** Local-calendar ISO date `offset` days before today, as the screen builds it. */
function isoDaysAgo(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Mounts the screen with sessions on `gymDates` and `kcal` on every day. */
async function renderHistory(gymDates: string[], kcal: number) {
  (api.gym.listSessions as jest.Mock).mockResolvedValue(gymDates.map((date) => ({ date })));
  (api.foodLogs.summary as jest.Mock).mockResolvedValue({ calories: kcal });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MealHistoryScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderHistory>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
const hasLabel = (tree: Tree, label: string) => findAll(tree, (p) => p.accessibilityLabel === label).length > 0;
const rowLabel = (template: string, day: string, kcal: number) =>
  template.replace('{{day}}', day).replace('{{energy}}', formatCalories(kcal));

test('no food and no gym shows the empty state copy from en.json', async () => {
  const tree = await renderHistory([], 0);
  expect(hasText(tree, en.history.emptyTitle)).toBe(true);
  expect(hasText(tree, en.history.emptyMessage)).toBe(true);
});

test('the row for yesterday shows the history.yesterday label', async () => {
  const tree = await renderHistory([], 500);
  expect(hasText(tree, en.history.yesterday)).toBe(true);
});

test('row labels use history.rowGymDone for a gym day and history.rowGymMissed otherwise', async () => {
  const tree = await renderHistory([isoDaysAgo(1)], 500);
  expect(hasLabel(tree, rowLabel(en.history.rowGymDone, en.history.yesterday, 500))).toBe(true);
  expect(hasLabel(tree, rowLabel(en.history.rowGymMissed, en.foodLog.today, 500))).toBe(true);
});
