// PHASE3_ROWS.md row 13, Saved screen (src/app/food/saved.tsx) no-data states.
// A failed load with nothing saved shows ErrorState, not "No saved foods yet";
// a successful empty load still shows the empty copy.
import SavedFoodsScreen from '@/app/food/saved';
import { useSavedFoods } from '@/lib/data';
import { findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}));

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useSavedFoods: jest.fn(),
}));

const ERROR_COPY = 'We hit a snag loading this. Please try again.';
const EMPTY_TITLE = 'No saved foods yet';

function renderSaved(error: Error | null) {
  (useSavedFoods as jest.Mock).mockReturnValue({ data: [], isLoading: false, error, refetch: jest.fn() });
  return renderScreen(<SavedFoodsScreen />);
}

type Tree = ReturnType<typeof renderSaved>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;

test('a failed load shows ErrorState, not the empty state', () => {
  const tree = renderSaved(new Error('Network request failed'));
  expect(hasText(tree, ERROR_COPY)).toBe(true);
  expect(hasText(tree, EMPTY_TITLE)).toBe(false);
});

test('a successful empty load shows the empty state', () => {
  const tree = renderSaved(null);
  expect(hasText(tree, EMPTY_TITLE)).toBe(true);
  expect(hasText(tree, ERROR_COPY)).toBe(false);
});
