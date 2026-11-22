// PHASE3_ROWS.md row 15, food detail meal picker (src/app/food/detail.tsx) in
// English, Spanish and French. A logged item opens with its meal picker; each
// option's visible and spoken label carries the addMenu slot name from the
// active locale file via mealSlotName, with no raw addMenu key.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FoodDetailScreen from '@/app/food/detail';
import { useFoodStore } from '@/lib/data/foodStore';
import { openFoodDetail } from '@/lib/food/detailSubject';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

const item = { id: 'it_rice', name: 'Rice', quantityG: 200, calories: 400, protein: 8, carbs: 88, fat: 2 };

// The pad reads the home-indicator inset, so the sheet needs the root SafeAreaProvider.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

beforeEach(() => {
  const s = useFoodStore.getState();
  s.setDayMeals(s.selectedDate, [
    { id: 'm1', slot: 'Lunch', time: '12:30', method: 'manual', calories: 400, protein: 8, carbs: 88, fat: 2, items: [item] },
  ]);
  openFoodDetail({ mode: 'logged', item, slot: 'Lunch' });
});

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('the meal picker shows and speaks the %s slot names', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodDetailScreen />
    </SafeAreaProvider>,
  );

  const text = allText(tree);
  for (const name of [locale.addMenu.breakfast, locale.addMenu.lunch, locale.addMenu.dinner, locale.addMenu.snack]) {
    expect(text).toContain(name);
    expect(findAll(tree, (p) => p.accessibilityLabel === name)).not.toHaveLength(0);
  }
  expect(text).not.toContain('addMenu.');
});
