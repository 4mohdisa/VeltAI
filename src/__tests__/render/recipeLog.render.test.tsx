// My Meals screen (PHASE2_ROWS.md row 8 "Saved foods / recipes / meals",
// Recipes segment, recipes.log path) — no render test existed for this call
// before (apiSurface.test.ts only asserts the api.recipes.log function
// exists, it never drives the screen). Copies the pattern of
// savedMealsLog.render.test.tsx: mock the api calls under test, drive the
// real UI to the log action — card "Log" opens the servings sheet, sheet
// "Log" confirms — and assert the exact payload the screen builds.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MealsScreen from '@/app/food/meals';
import { slotForNow } from '@/lib/data';
import { selectedFoodDate } from '@/lib/data/foodStore';
import type { Recipe } from '@/lib/api';
import { useToastStore } from '@/components/display/toastStore';
import { act, allText, findAll, renderScreen } from './helpers';

const mockList = jest.fn();
const mockLog = jest.fn();
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: {
    ...jest.requireActual('@/lib/api').api,
    recipes: {
      list: (...args: unknown[]) => mockList(...args),
      log: (...args: unknown[]) => mockLog(...args),
    },
  },
}));

// The loading state's SkeletonCard renders Skeleton, which animates through
// reanimated's useReducedMotion — unavailable in this render environment
// (same gap noted in savedMealsLog.render.test.tsx / energy.render.test.tsx).
// This test never asserts on the loading state, so a plain stand-in is enough.
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  SkeletonCard: () => null,
}));

// The shared expo-router mock (render/setup.ts) has no useFocusEffect —
// RecipesList needs one to load recipes on focus. Same stand-in as
// savedMealsLog.render.test.tsx: just run the effect once on mount.
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
  usePathname: () => '/food/meals',
  Href: {},
}));

const FIXTURE_RECIPE: Recipe = {
  id: 'r1',
  user_id: 'u1',
  name: 'My Curry',
  description: null,
  total_calories: 600,
  total_protein: 40,
  total_carbs: 30,
  total_fat: 20,
  total_fibre: 8,
  serving_count: 2,
  ingredients: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
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

test('switching to Recipes and pressing Log, then confirming, calls api.recipes.log with the recipe id, default servings, current slot and selected date', async () => {
  mockList.mockResolvedValue([FIXTURE_RECIPE]);
  mockLog.mockResolvedValue({ created: 1 });

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MealsScreen />
    </SafeAreaProvider>,
  );
  await settle();

  act(() => {
    const recipesTab = findAll(tree, (p) => p.accessibilityLabel === 'Recipes' && p.accessibilityRole === 'button')[0];
    (recipesTab.props.onPress as () => void)();
  });
  await settle();

  act(() => {
    (findAll(tree, (p) => p.title === 'Log')[0].props.onPress as () => void)();
  });

  await act(async () => {
    const sheetLog = findAll(tree, (p) => p.title === 'Log');
    (sheetLog[sheetLog.length - 1].props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockLog).toHaveBeenCalledWith('r1', 1, slotForNow(), selectedFoodDate());
});

test('a failed api.recipes.log call shows the error toast and leaves the recipe list rendered', async () => {
  mockList.mockResolvedValue([FIXTURE_RECIPE]);
  mockLog.mockRejectedValueOnce(new Error('network'));

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MealsScreen />
    </SafeAreaProvider>,
  );
  await settle();

  act(() => {
    const recipesTab = findAll(tree, (p) => p.accessibilityLabel === 'Recipes' && p.accessibilityRole === 'button')[0];
    (recipesTab.props.onPress as () => void)();
  });
  await settle();

  act(() => {
    (findAll(tree, (p) => p.title === 'Log')[0].props.onPress as () => void)();
  });

  await act(async () => {
    const sheetLog = findAll(tree, (p) => p.title === 'Log');
    (sheetLog[sheetLog.length - 1].props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(useToastStore.getState().current).toMatchObject({
    message: "Couldn't log My Curry. Try again.",
    tone: 'error',
  });
  expect(allText(tree)).toContain('My Curry');
});
