// The training screen's weekly energy chart labels each day with the app
// language's own letter from calendar.weekdayLetters (Monday first), through
// weekdayLetter — not the first letter of an English day name. Mon 7 – Sun 13
// September 2026 must read exactly as each locale's string.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import TrainingDetailScreen from '@/app/dashboard/training';
import { todayISO } from '@/lib/data/mappers';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import type { EnergyBalance, WeeklyEnergyBalance } from '@/lib/types';
import { act, findAll, renderScreen } from './helpers';

// Same boundary mocks as dashboardTraining.emptyStates.render.test.tsx.
const mockListSessions = jest.fn();
const mockGetWeek = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: { listSessions: (...args: unknown[]) => mockListSessions(...args) },
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
  // One session, so the screen shows its charts rather than the no-sessions state.
  const today = todayISO();
  mockListSessions.mockResolvedValue([
    { id: 's1', user_id: 'u1', date: today, name: 'Push day', notes: null, duration_minutes: 40, created_at: `${today}T09:00:00Z` },
  ]);
  mockGetWeek.mockResolvedValue(WEEK);
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TrainingDetailScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  // The weekly axis is the only caption row of single letters; the sessions
  // chart's axis carries "7 sept"-style marks and blanks.
  const letters = findAll(tree, (p) => p.variant === 'caption')
    .map((n) => n.props.children)
    .filter((c): c is string => typeof c === 'string' && /^\p{L}$/u.test(c))
    .join('');
  expect(letters).toBe(strings.calendar.weekdayLetters);
});
