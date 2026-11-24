// PHASE3_ROWS.md row 13, RecipesList no-data states. A failed recipes
// load shows ErrorState, not "No recipes yet"; an empty list still shows
// the empty copy; a loaded recipe shows its translated per-serving line.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { RecipesList } from '@/components/food/RecipesList';
import { api, type Recipe } from '@/lib/api';
import { act, findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useFocusEffect: (cb: () => void) => jest.requireActual('react').useEffect(cb, [cb]),
}));

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, api: { ...actual.api, recipes: { list: jest.fn(), log: jest.fn() } } };
});

const list = api.recipes.list as jest.Mock;

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

async function renderList() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <RecipesList onNew={jest.fn()} />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderList>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;

test('a failed load shows the error copy, not the empty copy', async () => {
  list.mockRejectedValue(new Error('Network request failed'));
  const tree = await renderList();
  expect(hasText(tree, 'We hit a snag loading this. Please try again.')).toBe(true);
  expect(hasText(tree, 'No recipes yet')).toBe(false);
});

test('an empty list with no error shows the empty copy', async () => {
  list.mockResolvedValue([]);
  const tree = await renderList();
  expect(hasText(tree, 'No recipes yet')).toBe(true);
  expect(hasText(tree, 'We hit a snag loading this. Please try again.')).toBe(false);
});

const CHILI: Recipe = {
  id: 'recipe-1',
  user_id: 'user-1',
  name: 'Chili',
  description: null,
  total_calories: 1600,
  total_protein: 120,
  total_carbs: 140,
  total_fat: 60,
  total_fibre: 40,
  serving_count: 4,
  ingredients: [],
  created_at: '2026-11-01T12:00:00Z',
  updated_at: '2026-11-01T12:00:00Z',
};

test('a loaded recipe shows the translated per-serving line and a named Log label', async () => {
  list.mockResolvedValue([CHILI]);
  const tree = await renderList();
  expect(hasText(tree, '400 kcal / serving · Makes 4')).toBe(true);
  expect(findAll(tree, (p) => p.accessibilityLabel === 'Log Chili').length).toBeGreaterThan(0);
});
