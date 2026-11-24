// The Macros detail screen's weekly chart scale ends in nutrition.gramsShort, and
// its percent footnote is the one full nutrition.macroPercentFootnote sentence in
// the app language — not English labels joined with a literal " · ".
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import NutritionDetailScreen from '@/app/dashboard/nutrition';
import type { StoredMeal, WeeklyMacroDay } from '@/lib/data';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, findAll, renderScreen } from './helpers';

// Same hook mocks as nutrition.axisLetters.render.test.tsx.
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

async function renderTexts(lang: string): Promise<string[]> {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <NutritionDetailScreen />
    </SafeAreaProvider>,
  );
  return findAll(tree, (p) => typeof p.children === 'string').map((n) => n.props.children as string);
}

// Week peak 380 g × 1.1 headroom = 418; today 80, 88, 89 and 13 % of target.
test.each([
  ['es', es, 'Proteína 80 % · Carbohidratos 88 % · Grasa 89 % · Fibra 13 %'],
  ['fr', fr, 'Protéines 80 % · Glucides 88 % · Lipides 89 % · Fibres 13 %'],
  ['en', en, 'Protein 80% · Carbs 88% · Fat 89% · Fibre 13%'],
])('%s: the chart scale and footnote are translated', async (lang, strings, footnote) => {
  const texts = await renderTexts(lang);
  expect(texts.filter((c) => c === `418${strings.nutrition.gramsShort}`).length).toBeGreaterThan(0);
  expect(texts.filter((c) => c === footnote).length).toBeGreaterThan(0);
});

// The old code joined "label pct%" parts with " · ", so es and fr read "80%".
test.each([
  ['es', es],
  ['fr', fr],
])('%s: the footnote no longer reads the old literal join', async (lang, strings) => {
  const texts = await renderTexts(lang);
  expect(texts.filter((c) => c.includes(`${strings.nutrition.protein} 80% · `))).toEqual([]);
});
