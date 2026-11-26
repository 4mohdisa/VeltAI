// Row 14b Fix 12 (option A): the Food tab's calorie card opens Nutrition only
// while the tab shows today, because Nutrition shows today only. On a past day
// the card is not a link. Mounts the real Food tab with one logged meal.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import FoodLogScreen from '@/app/(tabs)/food';
import { isoDate } from '@/lib/data/foodDays';
import { useFoodStore } from '@/lib/data/foodStore';
import { todayISO } from '@/lib/data/mappers';
import en from '@/lib/i18n/locales/en.json';
import type { Meal } from '@/lib/mock/data';
import { act, findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonList: () => null }));

const MEAL: Meal = {
  id: 'm1',
  slot: 'Lunch',
  time: '12:30',
  method: 'manual',
  calories: 480,
  protein: 32,
  carbs: 46,
  fat: 16,
  items: [{ name: 'Tuna sandwich', quantityG: 200, calories: 480, protein: 32, carbs: 46, fat: 16 }],
};
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useFoodLog: () => ({ data: [MEAL], isLoading: false, error: null, refetch: jest.fn() }),
}));
jest.mock('@/lib/data/aiBrain', () => ({
  useInsights: () => ({ insights: [], anomalies: [], loading: false, isError: false, dismiss: jest.fn() }),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  useFoodStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({ data: [], error: null }) }),
  );
});

/** The pressable that holds the calorie card's header, if the card is a link. */
async function calorieCardLink(date: string) {
  act(() => useFoodStore.getState().setSelectedDate(date));
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodLogScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  const title = en.gymLog.celebration.calories;
  expect(findAll(tree, (p) => p.children === title)).not.toHaveLength(0);
  return findAll(tree, (p) => typeof p.onPress === 'function').find(
    (n) => n.findAll((c) => c.props.children === title).length > 0,
  );
}

test('today: the calorie card opens Nutrition', async () => {
  const link = await calorieCardLink(todayISO());
  expect(link).toBeDefined();
  act(() => (link!.props.onPress as () => void)());
  expect(router.push).toHaveBeenCalledWith('/dashboard/nutrition');
});

test('a past day: the calorie card is not a link', async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  expect(await calorieCardLink(isoDate(yesterday))).toBeUndefined();
});
