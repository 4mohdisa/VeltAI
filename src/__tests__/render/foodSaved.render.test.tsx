// Food "My dishes" (saved foods) screen (PHASE2_ROWS.md row 8 "Saved foods /
// recipes / meals") — no render test existed for this screen before. This
// EXECUTES the real screen; it is not a source-text grep.
import SavedFoodsScreen from '@/app/food/saved';
import { useSavedFoods } from '@/lib/data';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useSavedFoods: jest.fn(() => ({ data: [], isLoading: false, error: null, refetch: jest.fn() })),
}));

const mockShowToast = jest.fn();
jest.mock('@/components/display/toastStore', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

beforeEach(() => {
  mockShowToast.mockClear();
});

const FIXTURE_FOOD = {
  id: 's1',
  name: 'Oats with whey',
  servingG: 250,
  calories: 320,
  protein: 28,
  carbs: 40,
  fat: 8,
};

test('renders a saved food row with its name', () => {
  (useSavedFoods as jest.Mock).mockReturnValue({
    data: [FIXTURE_FOOD],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  const tree = renderScreen(<SavedFoodsScreen />);
  const text = allText(tree);

  expect(text).toContain('My dishes');
  expect(text).toContain('Oats with whey');
});

test('shows the empty state when there are no saved foods', () => {
  (useSavedFoods as jest.Mock).mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  const tree = renderScreen(<SavedFoodsScreen />);
  expect(allText(tree)).toContain('No saved foods yet');
});

test('tapping the add button on a saved food logs it again and shows a confirmation toast', () => {
  (useSavedFoods as jest.Mock).mockReturnValue({
    data: [FIXTURE_FOOD],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  const tree = renderScreen(<SavedFoodsScreen />);
  const addButton = findAll(tree, (p) => p.accessibilityLabel === 'Add Oats with whey')[0];

  act(() => {
    (addButton.props.onPress as () => void)();
  });

  expect(mockShowToast).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Added Oats with whey.', tone: 'success' }),
  );
});
