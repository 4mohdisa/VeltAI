// Macros detail's 7-day stacked chart (PHASE2_ROWS.md row 21) — no render test
// mounted this screen against real per-day data before; detailChrome.render.test.tsx
// only snapshots it with useDailyMacros/useFoodLog mocked directly, never
// touching useWeeklyMacros. This mounts the real screen and mocks the API
// client (the same jest.fn() pattern as energy.render.test.tsx) so the real
// useWeeklyMacros hook — its 7 api.foodLogs.list calls and their aggregation —
// runs, and checks the chart it feeds actually reflects 7 real days.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NutritionDetailScreen from '@/app/dashboard/nutrition';
import { useFoodStore } from '@/lib/data/foodStore';
import { addDays, isoDate } from '@/lib/data/foodDays';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, renderScreen } from './helpers';

const mockList = jest.fn();
jest.mock('@/lib/api', () => ({ api: { foodLogs: { list: (...args: unknown[]) => mockList(...args) } } }));

// Skeleton animates through reanimated's useReducedMotion, which this render
// environment does not provide (same gap noted in energy.render.test.tsx and
// dashboardSummary.render.test.tsx) — it crashes the moment either hook's
// initial `isLoading: true` render hits it, before any data ever resolves.
// Neither assertion below is about the loading state, so a plain stand-in is enough.
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

// The last 7 local calendar days, oldest first — the same window useWeeklyMacros
// itself computes, so the fixture lines up with whatever "today" is at test time.
const DATES = Array.from({ length: 7 }, (_, i) => addDays(isoDate(new Date()), i - 6));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  useFoodStore.getState().reset();
  mockList.mockReset();
  mockList.mockImplementation(({ date }: { date: string }) => {
    const i = DATES.indexOf(date);
    // Two of the seven days have real logged macros; the rest have none —
    // today (index 6) stays empty so useFoodLog's own "today" read is benign.
    if (i === 2) return Promise.resolve([{ protein: 40, carbs: 60, fat: 20, fibre: 5 }]);
    if (i === 5) {
      return Promise.resolve([
        { protein: 80, carbs: 120, fat: 40, fibre: 0 },
        { protein: 20, carbs: 30, fat: 10, fibre: 0 },
      ]);
    }
    return Promise.resolve([]);
  });
});

test('the secondary chart renders 7 day columns, and the day with the most logged macros sets its real scale', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NutritionDetailScreen />
    </SafeAreaProvider>,
  );
  await settle();
  await settle();

  // 7 day-letter axis labels — one per column. labelFillsColumn is the only
  // place in this screen that sets ellipsizeMode; `AppText` is our own Text
  // primitive's composite name, which appears exactly once per logical label
  // (its own host Text/nested Text each re-render the same prop one level
  // deeper, so counting those would triple-count).
  expect(
    tree.root.findAll((n) => {
      const type = n.type as { displayName?: string; name?: string };
      return (
        (type.displayName === 'AppText' || type.name === 'AppText') &&
        (n.props as { ellipsizeMode?: string }).ellipsizeMode === 'tail'
      );
    }),
  ).toHaveLength(7);

  // The chart's own scale is the week's largest day (protein+carbs+fat+fibre =
  // 100+150+50+0 = 300, ×1.1 headroom = 330g) — real logged macros, not a
  // fabricated or all-zero scale, so that day's bars are real, non-zero height.
  expect(allText(tree)).toContain('330g');
});

// Fix 23: the chart's title names what it draws, seven days of grams.
test('the secondary chart is titled as the last 7 days of grams', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NutritionDetailScreen />
    </SafeAreaProvider>,
  );
  await settle();
  await settle();

  const text = allText(tree);
  expect(text).toContain(en.nutrition.weekGramsTitle);
  expect(text).toContain('Last 7 days');
  expect(text).not.toContain(en.nutrition.todayAgainstTargets);
});
