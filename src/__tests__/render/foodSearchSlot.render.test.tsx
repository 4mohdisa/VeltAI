// DESIGN_INTENT.md Fix list 1, Search path: a food found from a meal's
// "Add to dinner" is logged to dinner, not to the meal the clock suggests.
// Mounts the real Food tab (the foodTab.emptyStates pattern) with the log,
// the search and logMeal mocked; the clock is fixed at 8 am, a breakfast hour.
import { TextInput } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import FoodLogScreen from '@/app/(tabs)/food';
import { logMeal } from '@/lib/data';
import { useFoodStore } from '@/lib/data/foodStore';
import { openFoodDetail, useDetailSubject } from '@/lib/food/detailSubject';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import { mealSlotName } from '@/lib/mealSlotName';
import type { MealSlot } from '@/lib/mock/data';
import { act, findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonList: () => null }));
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useFoodLog: () => ({ data: [], isLoading: false, error: null, refetch: jest.fn() }),
  useFoodSearch: () => ({
    results: [{ id: 'oats', name: 'Rolled oats', kcalPer100: 380, protein: 13, carbs: 60, fat: 7 }],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  logMeal: jest.fn(),
}));
jest.mock('@/lib/food/detailSubject', () => ({
  ...jest.requireActual('@/lib/food/detailSubject'),
  openFoodDetail: jest.fn(),
}));
jest.mock('@/lib/data/aiBrain', () => ({
  useInsights: () => ({ insights: [], anomalies: [], loading: false, isError: false, dismiss: jest.fn() }),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};
// Only Date is faked, so the render and its async flushes run on real timers.
const BREAKFAST_HOUR = new Date(2026, 10, 27, 8, 0, 0);

beforeAll(() => {
  jest.useFakeTimers({
    now: BREAKFAST_HOUR,
    doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'performance', 'hrtime'],
  });
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  useFoodStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({ data: [], error: null }) }),
  );
});

/** The Food tab as reached from the Add sheet's "Search foods", then "oats" typed in. */
async function search(params: { slot?: string }) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodLogScreen />
    </SafeAreaProvider>,
  );
  const field = tree.root.findAll((n) => n.type === TextInput && n.props.placeholder === en.foodLog.searchPlaceholder)[0];
  await act(async () => {
    field.props.onChangeText('oats');
    await new Promise((r) => setImmediate(r));
  });
  return { tree, field };
}

type Tree = Awaited<ReturnType<typeof search>>['tree'];

/** The result row's one-tap "+", labelled with the meal it adds to. */
const addTo = (tree: Tree, slot: MealSlot) =>
  findAll(tree, (p) => p.accessibilityLabel === i18n.t('foodLog.addToMeal', { slot: mealSlotName(i18n.t, slot) }) && typeof p.onPress === 'function')[0];

const loggedSlot = () => jest.mocked(logMeal).mock.calls[0][0];

test('a food added from "Add to dinner" is logged to dinner', async () => {
  const { tree } = await search({ slot: 'Dinner' });
  act(() => (addTo(tree, 'Dinner').props.onPress as () => void)());
  expect(loggedSlot()).toBe('Dinner');
});

test('with no meal chosen, the food goes to the meal for the time of day', async () => {
  const { tree } = await search({});
  act(() => (addTo(tree, 'Breakfast').props.onPress as () => void)());
  expect(loggedSlot()).toBe('Breakfast');
});

test('opening the result keeps the chosen meal for the detail sheet', async () => {
  const { tree } = await search({ slot: 'Dinner' });
  // The outermost pressable holding the food's name is the row itself.
  const row = findAll(tree, (p) => typeof p.onPress === 'function').find(
    (n) => n.findAll((c) => c.props.children === 'Rolled oats').length > 0,
  );
  act(() => (row!.props.onPress as () => void)());
  expect(openFoodDetail).toHaveBeenCalledWith(expect.objectContaining({ mode: 'search', slot: 'Dinner' }));
});

test('clearing the search drops the chosen meal', async () => {
  const { field } = await search({ slot: 'Dinner' });
  act(() => field.props.onChangeText(''));
  expect(router.setParams).toHaveBeenCalledWith({ slot: undefined });
});

test('a log from the detail sheet drops the chosen meal', async () => {
  await search({ slot: 'Dinner' });
  act(() => useDetailSubject.getState().finishDetail());
  expect(router.setParams).toHaveBeenCalledWith({ slot: undefined });
});

test('a log from the detail sheet with no meal chosen changes no params', async () => {
  await search({});
  act(() => useDetailSubject.getState().finishDetail());
  expect(router.setParams).not.toHaveBeenCalled();
});
