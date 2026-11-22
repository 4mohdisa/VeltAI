// PHASE3_ROWS.md row 15, Macros detail (src/app/dashboard/nutrition.tsx) meal rows
// in English, Spanish and French. The data hooks are mocked, so nothing reaches the
// network. Each row's title and spoken label carry the addMenu slot name from
// the active locale file.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NutritionDetailScreen from '@/app/dashboard/nutrition';
import type { StoredMeal, WeeklyMacroDay } from '@/lib/data';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

const MACROS = {
  calories: { consumed: 1840, target: 2100 },
  protein: { consumed: 120, target: 150 },
  carbs: { consumed: 210, target: 240 },
  fat: { consumed: 62, target: 70 },
  fibre: { consumed: 4, target: 30 },
};
const meal = (id: string, slot: string) =>
  ({ id, slot, time: '08:10', calories: 420, protein: 28, carbs: 45, fat: 12, items: [] }) as unknown as StoredMeal;
const mockMeals = [meal('m1', 'Breakfast'), meal('m2', 'Lunch'), meal('m3', 'Dinner'), meal('m4', 'Snacks')];
const mockWeek: WeeklyMacroDay[] = Array.from({ length: 7 }, (_, i) => ({
  date: `2026-11-${String(16 + i).padStart(2, '0')}`,
  protein: 0,
  carbs: 0,
  fat: 0,
  fibre: 0,
}));

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useDailyMacros: () => MACROS,
  useFoodLog: () => ({ data: mockMeals, isLoading: false, error: null, refetch: jest.fn() }),
  useWeeklyMacros: () => ({ data: mockWeek, isLoading: false, error: null, refetch: jest.fn() }),
  useFibreConsumed: () => 4,
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('meal row titles and spoken labels use the %s slot names', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NutritionDetailScreen />
    </SafeAreaProvider>,
  );

  const text = allText(tree);
  for (const name of [locale.addMenu.breakfast, locale.addMenu.lunch, locale.addMenu.dinner, locale.addMenu.snack]) {
    expect(text).toContain(name);
    expect(
      findAll(tree, (p) => typeof p.accessibilityLabel === 'string' && p.accessibilityLabel.startsWith(`${name}, `)),
    ).not.toHaveLength(0);
  }
});
