// PHASE3_ROWS.md row 17, New Recipe ingredient search (EMPTY_STATES_AUDIT.md
// "Search results"): with a query typed, the sheet shows a skeleton while the
// search runs, a failure with Retry when it fails, and "No matches" when it
// returns nothing, instead of an empty card. useFoodSearch is mocked at the
// data-module boundary, so no network is called.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NewRecipeScreen from '@/app/food/new-recipe';
import { useFoodSearch } from '@/lib/data';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

// The loading skeleton needs reanimated's useReducedMotion, which this render
// environment does not provide (see scanCalibrationLocale.render.test.tsx).
jest.mock('@/components/display/LoadingSkeleton', () => ({ SkeletonList: () => 'skeleton-list' }));

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useFoodSearch: jest.fn(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const search = useFoodSearch as jest.Mock;
const retry = jest.fn();
const state = (over: Partial<{ isLoading: boolean; error: Error | null }>) => ({
  results: [],
  recents: [],
  isLoading: false,
  error: null,
  refetch: retry,
  ...over,
});

function openSearchWith(query: string) {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NewRecipeScreen />
    </SafeAreaProvider>,
  );
  act(() => {
    (buttonWithTitle(tree, en.newRecipe.addIngredient)!.props.onPress as () => void)();
  });
  act(() => {
    const field = findAll(tree, (p) => p.accessibilityLabel === en.addMenu.searchFoods && typeof p.onChangeText === 'function')[0];
    (field.props.onChangeText as (v: string) => void)(query);
  });
  return tree;
}

beforeEach(() => retry.mockClear());

test('a running search shows the skeleton, not an empty card or "No matches"', () => {
  search.mockReturnValue(state({ isLoading: true }));
  const text = allText(openSearchWith('oats'));
  expect(text).toContain('skeleton-list');
  expect(text).not.toContain('No matches');
});

test('a failed search says so and Retry re-runs it', () => {
  search.mockReturnValue(state({ error: new Error('network request failed') }));
  const tree = openSearchWith('oats');
  expect(allText(tree)).toContain(en.food.empty.searchFailed);
  act(() => {
    (buttonWithTitle(tree, en.errorState.retry)!.props.onPress as () => void)();
  });
  expect(retry).toHaveBeenCalledTimes(1);
});

test('a completed search with no results says "No matches"', () => {
  search.mockReturnValue(state({}));
  const text = allText(openSearchWith('zzzz'));
  expect(text).toContain(en.foodLog.noMatches.replace('{{query}}', 'zzzz'));
  expect(text).not.toContain(en.food.empty.searchFailed);
});

test('with no query and no recents the sheet shows the search hint, not an empty card', () => {
  search.mockReturnValue(state({}));
  const text = allText(openSearchWith(''));
  expect(text).toContain(en.newRecipe.searchHint);
  expect(text).not.toContain('No matches');
});
