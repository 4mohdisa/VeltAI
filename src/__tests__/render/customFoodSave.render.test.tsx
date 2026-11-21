// Custom food form (PHASE2_ROWS.md row 8 "Saved foods / recipes / meals",
// create path) — no render test existed for this screen before. This
// EXECUTES the real screen; it is not a source-text grep. saveFood is mocked
// the same way foodSaved.render.test.tsx mocks @/lib/data.
import CustomFoodScreen from '@/app/food/custom-food';
import { buttonWithTitle, findAll, act, renderScreen } from './helpers';

const mockSaveFood = jest.fn();
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  saveFood: (...args: unknown[]) => mockSaveFood(...args),
}));

beforeEach(() => {
  mockSaveFood.mockClear();
});

test('filling the form and pressing Save food calls saveFood with the entered macros', () => {
  const tree = renderScreen(<CustomFoodScreen />);

  const nameField = findAll(tree, (p) => p.label === 'Name')[0];
  const caloriesField = findAll(tree, (p) => p.label === 'Calories per 100g')[0];
  const proteinField = findAll(tree, (p) => p.label === 'Protein (g)')[0];

  act(() => {
    (nameField.props.onChangeText as (v: string) => void)('Rice Bowl');
    (caloriesField.props.onChangeText as (v: string) => void)('500');
    (proteinField.props.onChangeText as (v: string) => void)('20');
  });

  const save = buttonWithTitle(tree, 'Save food')!;
  act(() => {
    (save.props.onPress as () => void)();
  });

  expect(mockSaveFood).toHaveBeenCalledWith({
    name: 'Rice Bowl',
    servingG: 100,
    calories: 500,
    protein: 20,
    carbs: 0,
    fat: 0,
  });
});
