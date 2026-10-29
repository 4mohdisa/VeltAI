// V6 — the logged-food sheet, rendered. Its numbers read as values until "Edit
// values manually", after which each is a tile that docks the shared
// NumberEntryBar under that field's own caption; a preset re-derives them
// from the row's own per-gram values; the meal switch saves through the V1
// bottom pill; and fibre appears only when the row actually stored one.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FoodDetailScreen from '@/app/food/detail';
import { useFoodStore } from '@/lib/data/foodStore';
import { openFoodDetail } from '@/lib/food/detailSubject';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const item = { id: 'it_rice', name: 'Rice', quantityG: 200, calories: 400, protein: 8, carbs: 88, fat: 2 };

beforeEach(() => {
  const s = useFoodStore.getState();
  s.setDayMeals(s.selectedDate, [
    { id: 'm1', slot: 'Lunch', time: '12:30', method: 'manual', calories: 400, protein: 8, carbs: 88, fat: 2, items: [item] },
  ]);
  openFoodDetail({ mode: 'logged', item, slot: 'Lunch' });
});

type Tree = ReturnType<typeof renderScreen>;
const field = (tree: Tree, label: string) =>
  findAll(tree, (p) => p.label === label && typeof p.onChange === 'function')[0];
// The pad reads the home-indicator inset, so it cannot render without the
// SafeAreaProvider the real app mounts at its root. `initialMetrics` supplies
// the values synchronously, which a test renderer never measures.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
const renderSheet = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodDetailScreen />
    </SafeAreaProvider>,
  );

const tap = (tree: Tree, accessibilityLabel: string) =>
  act(() => {
    findAll(tree, (p) => p.accessibilityLabel === accessibilityLabel && typeof p.onPress === 'function')[0]
      .props.onPress();
  });

test('the numbers read as values, then each becomes a tile that opens its own pad', () => {
  const tree = renderSheet();
  const t = allText(tree);
  expect(t).toContain('Edit values manually');
  expect(t).toContain('8 g');
  expect(t).toContain('88 g');
  // Locked: nothing is tappable and no pad is docked.
  expect(t).not.toContain('Protein, tap to type');
  expect(t).not.toContain('Protein · grams');
  // This row never stored a fibre figure, so it gets no fibre row either way.
  expect(t).not.toMatch(/fibre/i);

  tap(tree, 'Edit values manually');
  const unlocked = allText(tree);
  // The design's tap targets stand in for the boxed fields that used to be
  // here: a grams chip, the kcal readout, and one tile per macro.
  expect(unlocked).toContain('Serving size, tap to type');
  expect(unlocked).toContain('Calories, tap to type');
  expect(unlocked).toContain('Protein, tap to type');
  expect(unlocked).toContain('Carbs, tap to type');
  expect(unlocked).toContain('Fat, tap to type');
  expect(unlocked).not.toContain('Protein (g)');
  expect(unlocked).not.toMatch(/fibre/i);

  // Tapping one docks the pad under that field's own design caption.
  tap(tree, 'Protein, tap to type');
  expect(allText(tree)).toContain('Protein · grams');
});

test('a row that stored fibre gets the fourth tile, and its own pad', () => {
  openFoodDetail({ mode: 'logged', item: { ...item, fibre: 6 }, slot: 'Lunch' });
  const tree = renderSheet();

  tap(tree, 'Edit values manually');
  expect(allText(tree)).toContain('Fibre, tap to type');

  tap(tree, 'Fibre, tap to type');
  expect(allText(tree)).toContain('Fibre · grams');
});

test('presets come from the row: picking double doubles every value', () => {
  const tree = renderScreen(<FoodDetailScreen />);
  const serving = field(tree, 'Serving size');
  expect(serving.props.options.map((o: { label: string }) => o.label)).toEqual(['100 g', '200 g', '300 g', '400 g']);

  act(() => serving.props.onChange('400'));
  const t = allText(tree);
  expect(t).toContain('800');
  expect(t).toContain('16 g');
  expect(t).toContain('176 g');
});

test('switching the meal and pressing the pill moves the row', () => {
  const tree = renderScreen(<FoodDetailScreen />);
  const meal = field(tree, 'Meal');
  expect(meal.props.value).toBe('Lunch');

  act(() => meal.props.onChange('Dinner'));
  act(() => buttonWithTitle(tree, 'Save changes')!.props.onPress());
  const meals = useFoodStore.getState().meals;
  expect(meals.map((m) => m.slot)).toEqual(['Dinner']);
  expect(meals[0].items[0]).toMatchObject({ id: 'it_rice', quantityG: 200, calories: 400 });
});
