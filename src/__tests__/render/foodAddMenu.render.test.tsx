// Add food menu (PHASE2_ROWS.md row 4 "Add food (menu)") — no render test ever
// mounted this screen before. This EXECUTES the real screen: a static chooser
// with no API calls, so nothing needs mocking beyond the shared expo-router
// spy already set up in render/setup.ts.
import { router } from 'expo-router';

import AddMealScreen from '@/app/food/add';
import { allText, findAll, renderScreen } from './helpers';

// Every tile add.tsx declares: its own label, description (joined into its
// accessibilityLabel) and the route its Pressable replaces to.
const TILES = [
  { label: 'Search foods', description: 'Apple, banana, Indomie…', route: '/(tabs)/food?focus=search' },
  { label: 'Scan food', description: 'Meal photo or label', route: '/food/photo-capture' },
  { label: 'Barcode', description: 'Exact database match', route: '/food/barcode-scan' },
  { label: 'My dishes', description: 'Your saved gallery', route: '/food/saved' },
  { label: 'Quick add', description: 'Just calories, fast', route: '/food/quick-add' },
];

beforeEach(() => {
  (router.replace as jest.Mock).mockClear();
});

test('every tile renders its label and replaces to its own route when pressed', () => {
  const tree = renderScreen(<AddMealScreen />);
  const text = allText(tree);

  for (const tile of TILES) {
    expect(text).toContain(tile.label);

    const pressable = findAll(tree, (p) => p.accessibilityLabel === `${tile.label}. ${tile.description}`)[0];
    expect(pressable).toBeDefined();
    (pressable.props.onPress as () => void)();
    expect(router.replace).toHaveBeenCalledWith(tile.route);
  }
});
