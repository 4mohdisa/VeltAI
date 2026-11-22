// PHASE3_ROWS.md row 13, SavedMealsList no-data states. A failed saved-meals
// load shows ErrorState, not "No saved meals yet"; an empty list still shows
// the empty copy.
import { SavedMealsList } from '@/components/food/SavedMealsList';
import { api } from '@/lib/api';
import { act, findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}));

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonCard: () => null,
  SkeletonList: () => null,
}));

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, api: { ...actual.api, savedMeals: { list: jest.fn(), log: jest.fn() } } };
});

const list = api.savedMeals.list as jest.Mock;

async function renderList() {
  const tree = renderScreen(<SavedMealsList />);
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
  expect(hasText(tree, 'No saved meals yet')).toBe(false);
});

test('an empty list with no error shows the empty copy', async () => {
  list.mockResolvedValue([]);
  const tree = await renderList();
  expect(hasText(tree, 'No saved meals yet')).toBe(true);
  expect(hasText(tree, 'We hit a snag loading this. Please try again.')).toBe(false);
});
