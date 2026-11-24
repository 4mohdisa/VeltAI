// The Macros detail screen's meal row reads its time and energy through the one
// nutrition.mealLine string in the app language, not a " · " joined in JSX.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NutritionDetailScreen from '@/app/dashboard/nutrition';
import type { StoredMeal, WeeklyMacroDay } from '@/lib/data';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, findAll, renderScreen } from './helpers';

// Same hook mocks as nutrition.axisLetters.render.test.tsx, with a fully typed meal.
const MACROS = {
  calories: { consumed: 1840, target: 2100 },
  protein: { consumed: 120, target: 150 },
  carbs: { consumed: 210, target: 240 },
  fat: { consumed: 62, target: 70 },
  fibre: { consumed: 4, target: 30 },
};
const mockMeals: StoredMeal[] = [
  { id: 'm1', slot: 'Breakfast', time: '08:10', method: 'manual', calories: 420, protein: 28, carbs: 45, fat: 12, items: [] },
];
const mockWeek: WeeklyMacroDay[] = Array.from({ length: 7 }, (_, i) => ({
  date: `2026-09-${String(7 + i).padStart(2, '0')}`,
  protein: 100,
  carbs: 200,
  fat: 60,
  fibre: 20,
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
  ['es', es],
  ['fr', fr],
  ['en', en],
])('%s: the meal row reads nutrition.mealLine with its time and energy', async (lang, strings) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NutritionDetailScreen />
    </SafeAreaProvider>,
  );

  const line = strings.nutrition.mealLine.replace('{{time}}', '08:10').replace('{{energy}}', '420 kcal');
  expect(findAll(tree, (p) => p.children === line).length).toBeGreaterThan(0);
});
