// Energy screen (PHASE2_ROWS.md row 18) — no render test exercised real hook
// data states before. detailChrome.render.test.tsx already mounts this screen,
// but only for one job: a byte-identical chrome snapshot against a hook
// mocked with fixed days. This file mocks the API client instead (the same
// jest.fn() pattern as quickAdd.render.test.tsx) so the real useEnergyRange
// hook — its fetch, merge and loading lifecycle — runs, and covers the states
// that file does not: a successful real-data render, the no-data empty state,
// and the failed-fetch state (which the hook degrades to the same empty state,
// per its own documented "nothing throws" contract, rather than a separate
// error UI).
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import EnergyScreen from '@/app/energy';
import { useEnergyRange } from '@/lib/data/energyRange';
import type { EnergyBalance, WeeklyEnergyBalance } from '@/lib/types';
import { readHook } from '../helpers/useApiHarness';
import { act, allText, renderScreen } from './helpers';

// The loading state's two Skeletons animate through reanimated's
// useReducedMotion, which this render environment does not provide (same gap
// noted in dashboardSummary.render.test.tsx and integrations.render.test.tsx).
// None of these tests assert on the loading state, so a plain stand-in is enough.
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

const FIXTURE_DAYS: EnergyBalance[] = [
  { date: '2026-01-13', calories_in: 1800, calories_out_bmr: 1500, calories_out_exercise: 0, calories_out_total: 1500, net_balance: 300, target: 2100, variance: null, status: 'surplus' },
  { date: '2026-01-14', calories_in: 1900, calories_out_bmr: 1500, calories_out_exercise: 300, calories_out_total: 1800, net_balance: 100, target: 2100, variance: null, status: 'surplus' },
  { date: '2026-01-15', calories_in: 2000, calories_out_bmr: 1500, calories_out_exercise: 250, calories_out_total: 1750, net_balance: 250, target: 2100, variance: null, status: 'surplus' },
];

const weekly = (days: EnergyBalance[]): WeeklyEnergyBalance => ({
  days,
  weekly_average_in: 1900,
  weekly_average_out: 1683,
  weekly_net: 217,
});

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  mockGetWeek.mockClear();
});

test('renders the real fourteen-day merge once both windows resolve', async () => {
  mockGetWeek.mockResolvedValue(weekly(FIXTURE_DAYS));

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <EnergyScreen />
    </SafeAreaProvider>,
  );
  await settle();

  const text = allText(tree);
  expect(text).toContain('+250');
  expect(text).toContain('kcal surplus');
  expect(text).toContain('Breakdown');
  expect(text).not.toContain('No data yet');
});

test('shows the no-data empty state when both windows resolve with no days', async () => {
  mockGetWeek.mockResolvedValue(weekly([]));

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <EnergyScreen />
    </SafeAreaProvider>,
  );
  await settle();

  const text = allText(tree);
  expect(text).toContain('No data yet');
  expect(text).toContain('Log some food and workouts to see your daily energy balance.');
});

test('a failed fetch degrades to the same no-data empty state, not a crash or fabricated data', async () => {
  mockGetWeek.mockRejectedValue(new Error('network request failed'));

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <EnergyScreen />
    </SafeAreaProvider>,
  );
  await settle();

  expect(allText(tree)).toContain('No data yet');
});

test('useEnergyRange reports isError when the request fails', async () => {
  mockGetWeek.mockRejectedValue(new Error('network request failed'));
  expect(await readHook(useEnergyRange)).toMatchObject({ days: [], loading: false, isError: true });
});

test('useEnergyRange keeps the other week and reports no error when only one week read fails', async () => {
  mockGetWeek
    .mockRejectedValueOnce(new Error('network request failed'))
    .mockResolvedValueOnce(weekly(FIXTURE_DAYS));
  expect(await readHook(useEnergyRange)).toMatchObject({ days: FIXTURE_DAYS, loading: false, isError: false });
  expect(mockGetWeek).toHaveBeenCalledTimes(2);
});
