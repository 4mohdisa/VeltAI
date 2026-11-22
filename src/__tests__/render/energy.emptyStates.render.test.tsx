// PHASE3_ROWS.md row 15, Energy balance (src/app/energy.tsx) states.
// @/lib/api is mocked at the boundary, so the real useEnergyRange runs. Each
// week read answers by its end date, so the two windows are told apart. Both
// reads failing shows the LoadFailedNotice and its Retry re-runs both reads; a
// first read still running shows neither the notice nor the empty state; reads
// with data show the screen, not the notice.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import EnergyScreen from '@/app/energy';
import { todayISO } from '@/lib/data/mappers';
import en from '@/lib/i18n/locales/en.json';
import type { EnergyBalance, WeeklyEnergyBalance } from '@/lib/types';
import { act, allText, findAll, renderScreen } from './helpers';

const mockGetWeek = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { energy: { getWeek: (...args: unknown[]) => mockGetWeek(...args) } },
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null, SkeletonCard: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

async function renderEnergy() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <EnergyScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

const weekly = (days: EnergyBalance[]): WeeklyEnergyBalance => ({
  days,
  weekly_average_in: 0,
  weekly_average_out: 0,
  weekly_net: 0,
});

const TODAY = todayISO();
const RECENT_DAY: EnergyBalance = {
  date: TODAY,
  calories_in: 2000,
  calories_out_bmr: 1500,
  calories_out_exercise: 250,
  calories_out_total: 1750,
  net_balance: 250,
  target: 2100,
  variance: null,
  status: 'surplus',
};

beforeEach(() => {
  mockGetWeek.mockReset();
});

test('both energy reads failing shows the load failure and Retry runs the reads again', async () => {
  mockGetWeek.mockRejectedValue(new Error('Network request failed'));
  const tree = await renderEnergy();

  const text = allText(tree);
  expect(text).toContain(en.dashboard.energyLoadFailed);
  expect(text).not.toContain(en.dashboard.energyNoDataTitle);
  expect(mockGetWeek).toHaveBeenCalledTimes(2);

  const retry = findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain && typeof p.onPress === 'function')[0];
  expect(retry).toBeDefined();
  await act(async () => {
    (retry.props.onPress as () => void)();
  });
  await settle();
  expect(mockGetWeek).toHaveBeenCalledTimes(4);
});

test('while the first read runs with nothing stored, neither the notice nor the empty state shows', async () => {
  mockGetWeek.mockReturnValue(new Promise(() => {}));
  const tree = await renderEnergy();

  const text = allText(tree);
  expect(text).not.toContain(en.dashboard.energyLoadFailed);
  expect(text).not.toContain(en.dashboard.energyNoDataTitle);
});

test('reads with data show the screen and no notice', async () => {
  mockGetWeek.mockImplementation((end: string) =>
    Promise.resolve(weekly(end === TODAY ? [RECENT_DAY] : [])),
  );
  const tree = await renderEnergy();

  const text = allText(tree);
  expect(text).toContain('+250');
  expect(text).not.toContain(en.dashboard.energyLoadFailed);
  expect(text).not.toContain(en.dashboard.energyNoDataTitle);
});
