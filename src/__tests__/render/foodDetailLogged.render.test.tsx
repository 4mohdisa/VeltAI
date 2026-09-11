// V6 — the logged-food sheet, rendered. Its numbers read as values (not fields)
// until "Edit values manually"; a preset re-derives them from the row's own
// per-gram values; the meal switch saves through the V1 bottom pill; and there
// is no fibre, because the log never stored any.
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

test('the numbers read as values, with a way to type over them — and no fibre', () => {
  const tree = renderScreen(<FoodDetailScreen />);
  const t = allText(tree);
  expect(t).toContain('Edit values manually');
  expect(t).toContain('8 g');
  expect(t).toContain('88 g');
  expect(t).not.toContain('Protein (g)');
  expect(t).not.toMatch(/fibre/i);

  act(() => {
    findAll(tree, (p) => p.accessibilityLabel === 'Edit values manually' && typeof p.onPress === 'function')[0].props.onPress();
  });
  expect(allText(tree)).toContain('Protein (g)');
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
