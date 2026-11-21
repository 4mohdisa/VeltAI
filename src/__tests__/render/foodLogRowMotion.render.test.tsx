// PHASE2_ROWS.md "Adding and removing list items" (food log scope). A logged
// row used to appear and disappear with the array splice alone — no enter when
// logMeal() adds one, no exit when deleteFoodItem() removes one. This mounts
// the real screen with a mocked GET /api/food/logs (the goals.render.test.tsx
// pattern) and checks the row Reanimated actually wraps, and that Reduce
// Motion drops the vertical slide and keeps only the fade (the same rule
// AddMenu.tsx already follows).
//
// react-native-reanimated is mocked for every render test (root __mocks__
// dir): every named entering/exiting preset collapses to its own
// BaseAnimationMock singleton, and .duration()/.delay() return that same
// instance — so `FadeInDown.duration(n) === FadeInDown` still holds, and a
// reference check tells the presets apart exactly where `instanceof` could
// not (they all share one mock class).
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { FadeIn, FadeInDown, FadeOut, FadeOutUp } from 'react-native-reanimated';

import FoodLogScreen from '@/app/(tabs)/food';
import { useFoodStore } from '@/lib/data/foodStore';
import { todayISO } from '@/lib/data/mappers';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => false) }));

// Skeleton animates through reanimated's useReducedMotion, which this render
// environment does not provide (same gap noted in energyBalanceCard.render.test.tsx);
// a plain stand-in is enough since nothing here asserts on loading placeholders.
jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const today = todayISO();
const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });
const LOGGED_ROW = {
  id: 'log1',
  user_id: 'u1',
  date: today,
  meal_type: 'lunch',
  food_name: 'Rice',
  brand: null,
  barcode: null,
  quantity: 200,
  unit: 'g',
  calories: 400,
  protein: 8,
  carbs: 88,
  fat: 2,
  fibre: 0,
  source: null,
  created_at: `${today}T12:30:00Z`,
  status: 'confirmed',
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  useFoodStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) => {
    if (url.includes('/api/food/logs')) return json([LOGGED_ROW]);
    return json([]);
  });
  (useReduceMotion as jest.Mock).mockReturnValue(false);
});

async function renderFoodLog() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodLogScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

test('a logged row enters and exits through Reanimated, with the slide', async () => {
  const tree = await renderFoodLog();
  const row = findAll(tree, (p) => p.entering !== undefined)[0];
  expect(row).toBeDefined();
  expect(row.props.entering).toBe(FadeInDown);
  expect(row.props.exiting).toBe(FadeOutUp);
});

test('Reduce Motion branch: a plain fade, no slide', async () => {
  (useReduceMotion as jest.Mock).mockReturnValue(true);
  const tree = await renderFoodLog();
  const row = findAll(tree, (p) => p.entering !== undefined)[0];
  expect(row.props.entering).toBe(FadeIn);
  expect(row.props.exiting).toBe(FadeOut);
  expect(row.props.entering).not.toBe(FadeInDown);
  expect(row.props.exiting).not.toBe(FadeOutUp);
});
