// PHASE3_ROWS.md row 15, food detail add button (src/app/food/detail.tsx) with a
// slot that is not one of SLOTS. The sheet takes its slot from slotForNow(), not
// route params, so slotForNow is mocked to answer an unknown slot. The button
// shows the foodLog.addMeal text, never an "Add to add meal" sentence.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FoodDetailScreen from '@/app/food/detail';
import { openFoodDetail } from '@/lib/food/detailSubject';
import en from '@/lib/i18n/locales/en.json';
import { findAll, renderScreen } from './helpers';

const mockUnknownSlot = 'Brunch';
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  slotForNow: () => mockUnknownSlot,
}));

// The pad reads the home-indicator inset, so the sheet needs the root SafeAreaProvider.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

test('an unknown slot shows the add meal label, not an add-to sentence', () => {
  openFoodDetail({ mode: 'search', name: 'Rice', kcalPer100: 130 });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodDetailScreen />
    </SafeAreaProvider>,
  );

  const titles = findAll(tree, (p) => typeof p.title === 'string' && typeof p.onPress === 'function').map(
    (n) => n.props.title as string,
  );
  expect(titles).toContain(en.foodLog.addMeal);
  expect(titles.join(' ')).not.toContain('Add to add meal');
});
