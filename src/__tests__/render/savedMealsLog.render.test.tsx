// My Meals screen (PHASE2_ROWS.md row 8 "Saved foods / recipes / meals",
// savedMeals.log path) — no render test existed for this screen before. This
// EXECUTES the real screen; it is not a source-text grep. Copies the pattern
// of recipeCreate.render.test.tsx: mock the api call under test (and the
// list call that feeds the screen), drive the real UI flow to the log
// action, and assert the exact payload passed to savedMeals.log.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MealsScreen from '@/app/food/meals';
import { slotForNow } from '@/lib/data';
import { selectedFoodDate } from '@/lib/data/foodStore';
import type { SavedMeal } from '@/lib/api';
import { useToastStore } from '@/components/display/toastStore';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

const mockList = jest.fn();
const mockLog = jest.fn();
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: {
    ...jest.requireActual('@/lib/api').api,
    savedMeals: {
      list: (...args: unknown[]) => mockList(...args),
      log: (...args: unknown[]) => mockLog(...args),
    },
  },
}));

// The loading state's SkeletonCard renders Skeleton, which animates through
// reanimated's useReducedMotion — unavailable in this render environment
// (same gap noted in dashboardSummary.render.test.tsx / energy.render.test.tsx).
// Neither test here asserts on the loading state, so a plain stand-in is enough.
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  SkeletonCard: () => null,
}));

// The shared expo-router mock (render/setup.ts) has no useFocusEffect — this
// screen is the first render test to need one, to load meals on focus. Same
// shape as the shared mock, plus a stand-in that just runs the effect once on
// mount (same pattern as gymStreakStripFootnote.render.test.tsx).
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (cb: () => void) => jest.requireActual('react').useEffect(cb, [cb]),
  usePathname: () => '/food/meals',
  Href: {},
}));

const FIXTURE_MEAL: SavedMeal = {
  id: 'm1',
  user_id: 'u1',
  name: 'Breakfast bowl',
  meal_type: 'breakfast',
  total_calories: 420,
  total_protein: 28,
  total_carbs: 45,
  total_fat: 12,
  total_fibre: 6,
  items: [],
  logged_count: 2,
  last_logged: null,
  auto_generated: false,
  created_at: '2026-01-01T00:00:00.000Z',
};

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  mockList.mockClear();
  mockLog.mockClear();
  useToastStore.getState().dismiss();
});

test('pressing Log now on a saved meal calls api.savedMeals.log with the meal id, current slot and selected date', async () => {
  mockList.mockResolvedValue([FIXTURE_MEAL]);
  mockLog.mockResolvedValue({ created: 1 });

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MealsScreen />
    </SafeAreaProvider>,
  );
  await settle();

  await act(async () => {
    (buttonWithTitle(tree, 'Log now')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockLog).toHaveBeenCalledWith('m1', slotForNow(), selectedFoodDate());
});

test('a failed api.savedMeals.log call shows the error toast and leaves the saved meal list rendered', async () => {
  mockList.mockResolvedValue([FIXTURE_MEAL]);
  mockLog.mockRejectedValueOnce(new Error('network'));

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MealsScreen />
    </SafeAreaProvider>,
  );
  await settle();

  await act(async () => {
    (buttonWithTitle(tree, 'Log now')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(useToastStore.getState().current).toMatchObject({
    message: "Couldn't log Breakfast bowl. Try again.",
    tone: 'error',
  });
  expect(allText(tree)).toContain('Breakfast bowl');
});
