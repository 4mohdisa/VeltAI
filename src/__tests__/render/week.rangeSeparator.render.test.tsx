// The This week detail screen's In and out stat line names the week as a date
// range joined by dashboard.rangeSeparator, not a hardcoded " – ". The en, es and
// fr values are all " – " today, so the last case swaps the fr string to prove the
// line reads the key rather than a literal.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import WeekDetailScreen from '@/app/dashboard/week';
import { dayMonth } from '@/lib/data/energyRange';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import type { EnergyBalance, WeeklyEnergyBalance } from '@/lib/types';
import { act, findAll, renderScreen } from './helpers';

// Same boundary mocks as week.axisLetters.render.test.tsx.
const mockGetWeek = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    energy: { getWeek: (...args: unknown[]) => mockGetWeek(...args) },
  },
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonCard: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const day = (date: string): EnergyBalance => ({
  date,
  calories_in: 2000,
  calories_out_bmr: 1500,
  calories_out_exercise: 300,
  calories_out_total: 1800,
  net_balance: 200,
  target: 2100,
  variance: -100,
  status: 'surplus',
});
const WEEK: WeeklyEnergyBalance = {
  days: Array.from({ length: 7 }, (_, i) => day(`2026-09-${String(7 + i).padStart(2, '0')}`)),
  weekly_average_in: 2000,
  weekly_average_out: 1800,
  weekly_net: 200,
};

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

async function rangeLines(lang: string): Promise<{ lines: string[]; expected: (sep: string) => string }> {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  mockGetWeek.mockResolvedValue(WEEK);
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <WeekDetailScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  const lines = findAll(tree, (p) => typeof p.children === 'string').map((n) => n.props.children as string);
  return { lines, expected: (sep) => `${dayMonth('2026-09-07')}${sep}${dayMonth('2026-09-13')}` };
}

test.each([
  ['es', es],
  ['fr', fr],
  ['en', en],
])('%s: the week range reads dashboard.rangeSeparator', async (lang, strings) => {
  const { lines, expected } = await rangeLines(lang);
  expect(lines.filter((l) => l === expected(strings.dashboard.rangeSeparator)).length).toBeGreaterThan(0);
});

test('en: the separator is " – "', () => {
  expect(en.dashboard.rangeSeparator).toBe(' – ');
});

test('the week range follows a changed separator string', async () => {
  i18n.addResource('fr', 'translation', 'dashboard.rangeSeparator', ' au ');
  try {
    const { lines, expected } = await rangeLines('fr');
    expect(lines.filter((l) => l === expected(' au ')).length).toBeGreaterThan(0);
  } finally {
    i18n.addResource('fr', 'translation', 'dashboard.rangeSeparator', fr.dashboard.rangeSeparator);
  }
});
