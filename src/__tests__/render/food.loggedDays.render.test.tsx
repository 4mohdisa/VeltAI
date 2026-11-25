// PHASE3_ROWS.md row 13, Food tab (src/app/(tabs)/food.tsx) when the logged-days
// read fails. The week strip stays, with LoadFailedNotice and its Retry above it,
// instead of a dotless week passing as "nothing logged". useLoggedDays is stubbed
// per test the same way calendar.error.render.test.tsx does it.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FoodLogScreen from '@/app/(tabs)/food';
import { useFoodLog } from '@/lib/data';
import type { LoggedDays } from '@/lib/data/foodDays';
import { useFoodStore, type StoredMeal } from '@/lib/data/foodStore';
import en from '@/lib/i18n/locales/en.json';
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

const mockLoggedDays = jest.fn<LoggedDays, []>();
jest.mock('@/lib/data/foodDays', () => ({
  ...jest.requireActual('@/lib/data/foodDays'),
  useLoggedDays: () => mockLoggedDays(),
}));

jest.mock('@/lib/offline/queue', () => ({
  ...jest.requireActual('@/lib/offline/queue'),
  subscribe: (listener: (count: number) => void) => {
    listener(0);
    return () => undefined;
  },
}));

jest.mock('@/lib/data/aiBrain', () => ({
  useInsights: () => ({ insights: [], anomalies: [], loading: false, isError: false, dismiss: jest.fn() }),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const refetchDays = jest.fn();

function loggedDays(error: Error | null): LoggedDays {
  const days: ReadonlySet<string> = new Set<string>();
  return { data: days, days, isLoading: false, loading: false, error, refetch: refetchDays };
}

beforeEach(() => {
  refetchDays.mockClear();
  useFoodStore.getState().reset();
  (useFoodLog as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null, refetch: jest.fn() });
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({ data: [], error: null }) }),
  );
});

async function renderFoodTab(error: Error | null) {
  mockLoggedDays.mockReturnValue(loggedDays(error));
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
const retryButtons = (tree: Tree) =>
  findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain && typeof p.onPress === 'function');
const weekStripShown = (tree: Tree) =>
  findAll(tree, (p) => p.accessibilityLabel === en.weekStrip.previousWeek).length > 0;

test('a failed logged-days read shows the message and a Retry button above a visible week strip', async () => {
  const tree = await renderFoodTab(new TypeError('Network request failed'));

  expect(hasText(tree, en.food.loggedDaysFailed)).toBe(true);
  // findAll sees the Pressable and its host view, so check presence, not a count.
  expect(retryButtons(tree).length).toBeGreaterThan(0);
  expect(weekStripShown(tree)).toBe(true);
});

test('pressing Retry calls refetch once', async () => {
  const tree = await renderFoodTab(new TypeError('Network request failed'));

  act(() => {
    (retryButtons(tree)[0].props.onPress as () => void)();
  });
  expect(refetchDays).toHaveBeenCalledTimes(1);
});

test('a successful read shows no message', async () => {
  const tree = await renderFoodTab(null);

  expect(hasText(tree, en.food.loggedDaysFailed)).toBe(false);
  expect(retryButtons(tree).length).toBe(0);
  expect(weekStripShown(tree)).toBe(true);
});

test('when the food log and the logged days both fail, only the food log notice shows', async () => {
  const meal: StoredMeal = {
    id: 'meal-1',
    slot: 'Lunch',
    time: '12:30',
    method: 'manual',
    calories: 420,
    protein: 30,
    carbs: 40,
    fat: 12,
    items: [{ id: 'item-1', name: 'Tuna sandwich', quantityG: 200, calories: 420, protein: 30, carbs: 40, fat: 12 }],
  };
  (useFoodLog as jest.Mock).mockReturnValue({
    data: [meal],
    isLoading: false,
    error: new TypeError('Network request failed'),
    refetch: jest.fn(),
  });
  const tree = await renderFoodTab(new TypeError('Network request failed'));

  expect(hasText(tree, en.food.loadFailed)).toBe(true);
  expect(hasText(tree, en.food.loggedDaysFailed)).toBe(false);
  expect(weekStripShown(tree)).toBe(true);
});
