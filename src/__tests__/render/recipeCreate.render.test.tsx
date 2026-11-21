// New Recipe screen (PHASE2_ROWS.md row 8 "Saved foods / recipes / meals",
// create path) — no render test existed for this screen before. This
// EXECUTES the real screen; it is not a source-text grep. Copies the
// structure of customFoodSave.render.test.tsx: mock the data-module function
// the create call reaches (api.recipes.create), plus useFoodSearch (so the
// ingredient picker has a deterministic food to pick, instead of the real
// debounced search), fill the real fields through their onChangeText, and
// press the real save control.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NewRecipeScreen from '@/app/food/new-recipe';
import { useFoodSearch } from '@/lib/data';
import type { FoodResult } from '@/lib/mock/data';
import { act, buttonWithTitle, findAll, renderScreen } from './helpers';

const mockCreateRecipe = jest.fn();
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: {
    ...jest.requireActual('@/lib/api').api,
    recipes: { create: (...args: unknown[]) => mockCreateRecipe(...args) },
  },
}));

const FIXTURE_FOOD: FoodResult = { name: 'Chicken breast', kcalPer100: 165, protein: 31, carbs: 0, fat: 3.6, fibre: 0 };

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useFoodSearch: jest.fn(() => ({ results: [], recents: [FIXTURE_FOOD], isLoading: false, error: null, refetch: jest.fn() })),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

beforeEach(() => {
  mockCreateRecipe.mockClear();
  (useFoodSearch as jest.Mock).mockReturnValue({ results: [], recents: [FIXTURE_FOOD], isLoading: false, error: null, refetch: jest.fn() });
});

test('adding an ingredient, naming the recipe and pressing Save Recipe calls api.recipes.create with the built payload', async () => {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NewRecipeScreen />
    </SafeAreaProvider>,
  );

  act(() => {
    (buttonWithTitle(tree, 'Add ingredient')!.props.onPress as () => void)();
  });
  act(() => {
    const pick = findAll(tree, (p) => p.accessibilityLabel === 'Add Chicken breast')[0];
    (pick.props.onPress as () => void)();
  });
  act(() => {
    const grams = findAll(tree, (p) => p.accessibilityLabel === 'Quantity in grams')[0];
    (grams.props.onChangeText as (v: string) => void)('150');
  });
  act(() => {
    (buttonWithTitle(tree, 'Add to recipe')!.props.onPress as () => void)();
  });
  act(() => {
    const name = findAll(tree, (p) => p.label === 'Name')[0];
    (name.props.onChangeText as (v: string) => void)('My Curry');
  });

  await act(async () => {
    (buttonWithTitle(tree, 'Save Recipe')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockCreateRecipe).toHaveBeenCalledWith({
    name: 'My Curry',
    serving_count: 1,
    ingredients: [
      { food_name: 'Chicken breast', quantity_g: 150, calories: 248, protein: 46.5, carbs: 0, fat: 5.4, fibre: 0 },
    ],
  });
});
