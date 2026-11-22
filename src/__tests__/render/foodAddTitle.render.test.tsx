// PHASE3_ROWS.md row 15, add sheet title (src/app/food/add.tsx). Opened from a
// meal's "+" the sheet is titled after that meal in the active language; with
// an unknown or missing ?slot= it keeps the generic addMenu.title and never
// shows a raw key. The shared expo-router mock always answers {} for params,
// so it is overridden here with a jest.fn() each test can set.
import AddMealScreen from '@/app/food/add';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, allText, findAll, renderScreen } from './helpers';

const mockParams = jest.fn((): { slot?: string } => ({}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams(),
  usePathname: () => '/food/add',
  Href: {},
}));

const titleNodes = (tree: ReturnType<typeof renderScreen>, title: string) =>
  findAll(tree, (p) => p.children === title);

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('with slot=Lunch in Spanish the title names the Spanish meal', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  mockParams.mockReturnValue({ slot: 'Lunch' });
  const tree = renderScreen(<AddMealScreen />);

  const title = es.addMenu.addToSlot.replace('{{slot}}', es.addMenu.lunch.toLowerCase());
  expect(titleNodes(tree, title)).not.toHaveLength(0);
  expect(allText(tree)).not.toContain(es.addMenu.title);
});

test.each([
  ['an unknown', { slot: 'Brunch' }],
  ['a missing', {}],
])('with %s slot the title is addMenu.title and no raw key shows', (_label, params) => {
  mockParams.mockReturnValue(params);
  const tree = renderScreen(<AddMealScreen />);

  expect(titleNodes(tree, en.addMenu.title)).not.toHaveLength(0);
  expect(allText(tree)).not.toContain('addMenu.');
});
