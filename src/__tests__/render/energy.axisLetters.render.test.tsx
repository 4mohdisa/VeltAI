// The energy screen's weekly chart labels each day with the app language's own
// letter from calendar.weekdayLetters (Monday first), through weekdayLetter —
// not the first letter of an English day name. Mon 7 – Sun 13 September 2026
// must read exactly as each locale's string.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import EnergyScreen from '@/app/energy';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import type { EnergyBalance, WeeklyEnergyBalance } from '@/lib/types';
import { act, findAll, renderScreen } from './helpers';

// Same stand-in as energy.render.test.tsx: Skeleton animates through
// reanimated's useReducedMotion, which this render environment lacks.
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));

const mockGetWeek = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { energy: { getWeek: (...args: unknown[]) => mockGetWeek(...args) } },
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const day = (date: string): EnergyBalance => ({
  date,
  calories_in: 1800,
  calories_out_bmr: 1500,
  calories_out_exercise: 300,
  calories_out_total: 1800,
  net_balance: 0,
  target: 2100,
  variance: null,
  status: 'on_target',
});
const WEEK: WeeklyEnergyBalance = {
  days: Array.from({ length: 7 }, (_, i) => day(`2026-09-${String(7 + i).padStart(2, '0')}`)),
  weekly_average_in: 1800,
  weekly_average_out: 1800,
  weekly_net: 0,
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
  mockGetWeek.mockResolvedValue(WEEK);
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <EnergyScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  // The weekly axis is the only caption row of single letters; the 14-day
  // axis carries "7 sept"-style marks and blanks.
  const letters = findAll(tree, (p) => p.variant === 'caption')
    .map((n) => n.props.children)
    .filter((c): c is string => typeof c === 'string' && /^\p{L}$/u.test(c))
    .join('');
  expect(letters).toBe(strings.calendar.weekdayLetters);
});
