// PHASE3_ROWS.md row 13, New Recipe screen (src/app/food/new-recipe.tsx) strings.
// Title, field labels, the empty ingredient list, the buttons and the picker
// rows come from t(), so switching the language to Spanish changes each one.
// Mocks match recipeCreate.render.test.tsx. The save toasts are read from the
// toast store, as savedMealsLog.render.test.tsx does.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NewRecipeScreen from '@/app/food/new-recipe';
import { useToastStore } from '@/components/display/toastStore';
import { api } from '@/lib/api';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import type { FoodResult } from '@/lib/mock/data';
import { act, buttonWithTitle, findAll, renderScreen } from './helpers';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: { ...jest.requireActual('@/lib/api').api, recipes: { create: jest.fn() } },
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

function renderNewRecipe() {
  return renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NewRecipeScreen />
    </SafeAreaProvider>,
  );
}

type Tree = ReturnType<typeof renderNewRecipe>;
// A Text with a brand prefix renders its children as an array, so match either shape.
const hasText = (tree: Tree, text: string) =>
  findAll(tree, (p) => p.children === text || (Array.isArray(p.children) && p.children.includes(text))).length > 0;
const hasLabel = (tree: Tree, label: string) =>
  findAll(tree, (p) => p.label === label || p.accessibilityLabel === label).length > 0;

function openPicker(tree: Tree, addIngredient: string) {
  act(() => {
    (buttonWithTitle(tree, addIngredient)!.props.onPress as () => void)();
  });
}

const createRecipe = api.recipes.create as jest.Mock;

/** Adds one ingredient, names the recipe and presses Save, the recipeCreate.render.test.tsx flow. */
async function fillAndSave(tree: Tree) {
  openPicker(tree, 'Add ingredient');
  act(() => {
    (findAll(tree, (p) => p.accessibilityLabel === 'Add Chicken breast')[0].props.onPress as () => void)();
  });
  act(() => {
    (findAll(tree, (p) => p.accessibilityLabel === 'Quantity in grams')[0].props.onChangeText as (v: string) => void)('150');
  });
  act(() => {
    (buttonWithTitle(tree, 'Add to recipe')!.props.onPress as () => void)();
  });
  act(() => {
    (findAll(tree, (p) => p.label === 'Name')[0].props.onChangeText as (v: string) => void)('My Curry');
  });
  await act(async () => {
    (buttonWithTitle(tree, 'Save Recipe')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

afterEach(async () => {
  useToastStore.getState().dismiss();
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('English: screen and picker strings render from t()', () => {
  const tree = renderNewRecipe();
  expect(hasText(tree, 'New Recipe')).toBe(true);
  expect(hasText(tree, 'Ingredients')).toBe(true);
  expect(hasText(tree, 'No ingredients yet')).toBe(true);
  expect(hasLabel(tree, 'Servings this makes')).toBe(true);
  expect(buttonWithTitle(tree, 'Save Recipe')).toBeTruthy();
  openPicker(tree, 'Add ingredient');
  expect(hasLabel(tree, 'Add Chicken breast')).toBe(true);
  expect(hasText(tree, '165 kcal / 100g')).toBe(true);
});

test('Spanish: the same strings switch language', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const tree = renderNewRecipe();
  expect(hasText(tree, 'Nueva receta')).toBe(true);
  expect(hasText(tree, 'Ingredientes')).toBe(true);
  expect(hasText(tree, 'Todavía no hay ingredientes')).toBe(true);
  expect(hasLabel(tree, 'Raciones que rinde')).toBe(true);
  expect(buttonWithTitle(tree, 'Guardar receta')).toBeTruthy();
  openPicker(tree, 'Añadir ingrediente');
  expect(hasText(tree, '165 kcal / 100 g')).toBe(true);
  expect(hasText(tree, 'New Recipe')).toBe(false);
});

test('a successful save shows the newRecipe.saved toast', async () => {
  createRecipe.mockResolvedValue(undefined);
  const tree = renderNewRecipe();
  await fillAndSave(tree);
  expect(useToastStore.getState().current).toMatchObject({ message: en.newRecipe.saved, tone: 'success' });
});

test('a failed save shows the newRecipe.saveFailed toast', async () => {
  createRecipe.mockRejectedValue(new Error('Network request failed'));
  const tree = renderNewRecipe();
  await fillAndSave(tree);
  expect(useToastStore.getState().current).toMatchObject({ message: en.newRecipe.saveFailed, tone: 'error' });
});
