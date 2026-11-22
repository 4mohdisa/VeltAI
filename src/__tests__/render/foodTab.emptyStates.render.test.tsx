// PHASE3_ROWS.md row 13, Food tab states with no meals. Mounts the real Food tab
// (the food.anomalyError.render.test.tsx pattern) with useFoodLog and useInsights
// mocked, and checks each no-data state shows its own copy: today, a past day
// (which used to say "add your first meal"), a failed read, and loading.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FoodLogScreen from '@/app/(tabs)/food';
import { useFoodLog } from '@/lib/data';
import { useFoodStore } from '@/lib/data/foodStore';
import { todayISO } from '@/lib/data/mappers';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useFoodLog: jest.fn(),
}));

jest.mock('@/lib/data/aiBrain', () => ({
  useInsights: () => ({ insights: [], anomalies: [], loading: false, isError: false, dismiss: jest.fn() }),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

type FoodLogState = { isLoading?: boolean; error?: Error | null };

const foodLog = ({ isLoading = false, error = null }: FoodLogState) => ({
  data: [],
  isLoading,
  error,
  refetch: jest.fn(),
});

const PAST_DAY = '2020-01-01';

beforeEach(() => {
  useFoodStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({ data: [], error: null }) }),
  );
});

async function renderFoodTab(state: FoodLogState, date = todayISO()) {
  (useFoodLog as jest.Mock).mockReturnValue(foodLog(state));
  act(() => useFoodStore.getState().setSelectedDate(date));
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodLogScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderFoodTab>>;
// allText's JSON.stringify trips on a circular prop in the full Food screen tree,
// so match the rendered string children directly.
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;

test('today with no meals shows "No meals yet" and the first-meal hint', async () => {
  const tree = await renderFoodTab({});
  expect(hasText(tree, 'No meals yet')).toBe(true);
  expect(hasText(tree, 'Tap + to add your first meal.')).toBe(true);
});

test('a past day with no meals says nothing was logged, not "add your first meal"', async () => {
  const tree = await renderFoodTab({}, PAST_DAY);
  expect(hasText(tree, 'No meals yet')).toBe(true);
  expect(hasText(tree, 'Nothing was logged on this day.')).toBe(true);
  expect(hasText(tree, 'Tap + to add your first meal.')).toBe(false);
});

test('a failed read shows the load error, not the empty state', async () => {
  const tree = await renderFoodTab({ error: new Error('Network request failed') });
  expect(hasText(tree, "We couldn't load today's food log. Check your connection and try again.")).toBe(true);
  expect(hasText(tree, 'No meals yet')).toBe(false);
});

test('loading shows the skeleton, not the empty state', async () => {
  const tree = await renderFoodTab({ isLoading: true });
  expect(findAll(tree, (p) => p.rows === 5).length).toBeGreaterThan(0);
  expect(hasText(tree, 'No meals yet')).toBe(false);
});
