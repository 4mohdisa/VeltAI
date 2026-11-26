// Custom food form (PHASE2_ROWS.md row 8 "Saved foods / recipes / meals",
// create path) — no render test existed for this screen before. This
// EXECUTES the real screen; it is not a source-text grep. saveFood is mocked
// the same way foodSaved.render.test.tsx mocks @/lib/data.
import { router } from 'expo-router';

import CustomFoodScreen from '@/app/food/custom-food';
import { buttonWithTitle, findAll, act, renderScreen } from './helpers';

const mockSaveFood = jest.fn();
const mockLogMeal = jest.fn();
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  saveFood: (...args: unknown[]) => mockSaveFood(...args),
  logMeal: (...args: unknown[]) => mockLogMeal(...args),
}));

beforeEach(() => {
  mockSaveFood.mockClear();
  mockLogMeal.mockClear();
  jest.mocked(router.back).mockClear();
});

afterEach(() => jest.restoreAllMocks());

/** Fill name, calories and fibre, then press Save food. */
function saveRiceBowl(tree: ReturnType<typeof renderScreen>) {
  const field = (label: string) => findAll(tree, (p) => p.label === label)[0];
  act(() => {
    (field('Name').props.onChangeText as (v: string) => void)('Rice Bowl');
    (field('Calories per 100g').props.onChangeText as (v: string) => void)('500');
    (field('Fibre (g)').props.onChangeText as (v: string) => void)('4');
  });
  act(() => (buttonWithTitle(tree, 'Save food')!.props.onPress as () => void)());
}

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

// Row 14b Fix 13.
test('the fibre typed in is saved with the food', () => {
  saveRiceBowl(renderScreen(<CustomFoodScreen />));
  expect(mockSaveFood).toHaveBeenCalledWith(expect.objectContaining({ name: 'Rice Bowl', fibre: 4 }));
  expect(mockLogMeal).not.toHaveBeenCalled();
});

test('opened from "no matches" with a meal, saving also logs the food to that meal and goes back', () => {
  jest
    .spyOn(jest.requireMock<typeof import('expo-router')>('expo-router'), 'useLocalSearchParams')
    .mockReturnValue({ slot: 'Dinner' });
  saveRiceBowl(renderScreen(<CustomFoodScreen />));

  expect(mockSaveFood).toHaveBeenCalledTimes(1);
  expect(mockLogMeal).toHaveBeenCalledWith(
    'Dinner',
    { name: 'Rice Bowl', quantityG: 100, calories: 500, protein: 0, carbs: 0, fat: 0, fibre: 4 },
    'manual',
  );
  expect(router.back).toHaveBeenCalled();
});
