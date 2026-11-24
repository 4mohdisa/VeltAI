// The Macros detail screen's weekly chart labels each day with the app
// language's own letter from calendar.weekdayLetters (Monday first), through
// weekdayLetter — not the first letter of an English day name. Mon 7 – Sun 13
// September 2026 must read exactly as each locale's string.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NutritionDetailScreen from '@/app/dashboard/nutrition';
import type { StoredMeal, WeeklyMacroDay } from '@/lib/data';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, findAll, renderScreen } from './helpers';

// Same hook mocks as dashboardNutrition.locale.render.test.tsx, with one logged
// meal and a Monday-first September week.
const MACROS = {
  calories: { consumed: 1840, target: 2100 },
  protein: { consumed: 120, target: 150 },
  carbs: { consumed: 210, target: 240 },
  fat: { consumed: 62, target: 70 },
  fibre: { consumed: 4, target: 30 },
};
const mockMeals = [
  { id: 'm1', slot: 'Breakfast', time: '08:10', calories: 420, protein: 28, carbs: 45, fat: 12, items: [] } as unknown as StoredMeal,
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
])('%s: the weekly axis reads calendar.weekdayLetters', async (lang, strings) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NutritionDetailScreen />
    </SafeAreaProvider>,
  );

  // The weekly axis is the screen's only caption row of single letters.
  const letters = findAll(tree, (p) => p.variant === 'caption')
    .map((n) => n.props.children)
    .filter((c): c is string => typeof c === 'string' && /^\p{L}$/u.test(c))
    .join('');
  expect(letters).toBe(strings.calendar.weekdayLetters);
});
