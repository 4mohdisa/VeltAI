// PHASE3_ROWS.md row 15, Macros detail (src/app/dashboard/nutrition.tsx) states.
// The data hooks the screen reads are mocked, so nothing reaches the network.
// While the first read runs with nothing stored no number shows; a failed week
// read shows the LoadFailedNotice instead of a chart of zero bars, and its Retry
// re-runs the read; fibre that no logged food carries shows a dash, not 0 g.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NutritionDetailScreen from '@/app/dashboard/nutrition';
import type { StoredMeal, WeeklyMacroDay } from '@/lib/data';
import en from '@/lib/i18n/locales/en.json';
import { allText, findAll, renderScreen } from './helpers';

const MACROS = {
  calories: { consumed: 1840, target: 2100 },
  protein: { consumed: 120, target: 150 },
  carbs: { consumed: 210, target: 240 },
  fat: { consumed: 62, target: 70 },
};
const MEAL = { id: 'm1', slot: 'Breakfast', time: '08:10', calories: 420, protein: 28, carbs: 45, fat: 12, items: [] } as unknown as StoredMeal;
const WEEK: WeeklyMacroDay[] = Array.from({ length: 7 }, (_, i) => ({
  date: `2026-11-${String(16 + i).padStart(2, '0')}`,
  protein: 0,
  carbs: 0,
  fat: 0,
  fibre: 0,
}));

const mockState = {
  foodLog: { data: [MEAL], isLoading: false, error: null as Error | null },
  week: { data: WEEK, isLoading: false, error: null as Error | null },
  fibre: 4 as number | null,
};
const mockWeekRefetch = jest.fn();

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useDailyMacros: () => ({ ...MACROS, fibre: { consumed: mockState.fibre ?? 0, target: 30 } }),
  useFoodLog: () => ({ ...mockState.foodLog, refetch: jest.fn() }),
  useWeeklyMacros: () => ({ ...mockState.week, refetch: mockWeekRefetch }),
  useFibreConsumed: () => mockState.fibre,
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const renderNutrition = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NutritionDetailScreen />
    </SafeAreaProvider>,
  );

type Tree = ReturnType<typeof renderNutrition>;
const breakdownLabel = (tree: Tree, macro: string) =>
  findAll(tree, (p) => typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.startsWith(`${macro},`))[0]?.props
    .accessibilityLabel as string | undefined;

beforeEach(() => {
  mockState.foodLog = { data: [MEAL], isLoading: false, error: null };
  mockState.week = { data: WEEK, isLoading: false, error: null };
  mockState.fibre = 4;
  mockWeekRefetch.mockReset();
});

test('while the first read runs with nothing stored, no number and no empty copy shows', () => {
  mockState.foodLog = { data: [], isLoading: true, error: null };
  const tree = renderNutrition();

  const text = allText(tree);
  expect(text).not.toContain('1,840');
  expect(text).not.toContain('1840');
  expect(text).not.toContain(en.nutrition.noMealsToday);
  expect(breakdownLabel(tree, en.nutrition.protein)).toBe(`${en.nutrition.protein}, — of 150 g`);
});

test('a failed week read shows the load failure, no zero-bar chart, and Retry runs the read again', () => {
  mockState.week = { data: WEEK, isLoading: false, error: new Error('Network request failed') };
  const tree = renderNutrition();

  expect(allText(tree)).toContain(en.dashboard.weekMacrosLoadFailed);
  const summary = en.nutrition.weekMacrosSummary.split('{{')[0];
  expect(findAll(tree, (p) => typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.startsWith(summary))).toHaveLength(0);

  const retry = findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain && typeof p.onPress === 'function')[0];
  expect(retry).toBeDefined();
  (retry.props.onPress as () => void)();
  expect(mockWeekRefetch).toHaveBeenCalledTimes(1);
});

test('no logged fibre shows a dash, not 0 g', () => {
  mockState.fibre = null;
  const tree = renderNutrition();

  expect(breakdownLabel(tree, en.nutrition.fibre)).toBe(`${en.nutrition.fibre}, — of 30 g`);
  expect(allText(tree)).toContain(`${en.nutrition.fibre} —`);
  expect(breakdownLabel(tree, en.nutrition.protein)).toBe(`${en.nutrition.protein}, 80% of target, 120 of 150 g`);
});

test('logged fibre of 12 g shows 12 g', () => {
  mockState.fibre = 12;
  const tree = renderNutrition();

  expect(breakdownLabel(tree, en.nutrition.fibre)).toBe(`${en.nutrition.fibre}, 40% of target, 12 of 30 g`);
  expect(allText(tree)).toContain(`${en.nutrition.fibre} 40%`);
});
