// PHASE3_ROWS.md row 13, My Meals screen (src/app/food/meals.tsx) strings. The
// title, eyebrow, segment labels and the + button's label come from t(), so
// switching the language to Spanish changes every one of them.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MealsScreen from '@/app/food/meals';
import i18n from '@/lib/i18n';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, api: { ...actual.api, savedMeals: { list: jest.fn(async () => []), log: jest.fn() } } };
});

jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  SkeletonCard: () => null,
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (cb: () => void) => jest.requireActual('react').useEffect(cb, [cb]),
  usePathname: () => '/food/meals',
  Href: {},
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

async function renderMeals() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MealsScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderMeals>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
const hasLabel = (tree: Tree, label: string) => findAll(tree, (p) => p.accessibilityLabel === label).length > 0;

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('English: title, eyebrow, segments and the + label render from t()', async () => {
  const tree = await renderMeals();
  expect(hasText(tree, 'My Meals')).toBe(true);
  expect(hasText(tree, 'Food')).toBe(true);
  expect(hasText(tree, 'Recipes')).toBe(true);
  expect(hasLabel(tree, 'New recipe')).toBe(true);
});

test('Spanish: the same strings switch language', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const tree = await renderMeals();
  expect(hasText(tree, 'Mis comidas')).toBe(true);
  expect(hasText(tree, 'Comida')).toBe(true);
  expect(hasText(tree, 'Recetas')).toBe(true);
  expect(hasLabel(tree, 'Nueva receta')).toBe(true);
  expect(hasText(tree, 'My Meals')).toBe(false);
});
