// The Energy screen follows the energy unit setting: every number and unit on it
// reads in kcal or kJ as chosen, instead of always saying "kcal". The real
// useEnergyRange hook runs against a mocked API client, as in energy.render.test.tsx.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import EnergyScreen from '@/app/energy';
import { useSettingsStore } from '@/lib/settings/store';
import type { EnergyBalance, WeeklyEnergyBalance } from '@/lib/types';
import { UNIT_OPTIONS, type EnergyUnit } from '@/lib/units';
import { act, allText, findAll, renderScreen } from './helpers';

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

const DAYS: EnergyBalance[] = [
  { date: '2026-01-13', calories_in: 1800, calories_out_bmr: 1500, calories_out_exercise: 0, calories_out_total: 1500, net_balance: 300, target: 2100, variance: null, status: 'surplus' },
  { date: '2026-01-14', calories_in: 1900, calories_out_bmr: 1500, calories_out_exercise: 300, calories_out_total: 1800, net_balance: 100, target: 2100, variance: null, status: 'surplus' },
  { date: '2026-01-15', calories_in: 2000, calories_out_bmr: 1500, calories_out_exercise: 250, calories_out_total: 1750, net_balance: 250, target: 2100, variance: null, status: 'surplus' },
];
const WEEK: WeeklyEnergyBalance = { days: DAYS, weekly_average_in: 1900, weekly_average_out: 1683, weekly_net: 217 };

const startUnit = useSettingsStore.getState().units.energy;
afterAll(() => {
  useSettingsStore.getState().setUnit('energy', startUnit);
});

// Latest day: net +250 kcal, eaten 2,000, target 2,100; burns average 1,683.
// In kJ (× 4.184): +1,046, 8,368, 8,786 and 7,043.
const EXPECTED: Record<EnergyUnit, { net: string; texts: string[] }> = {
  kcal: { net: '+250', texts: ['kcal surplus', '1,683 kcal burned', 'Target 2,100 kcal.'] },
  kJ: { net: '+1,046', texts: ['kJ surplus', '7,043 kJ burned', 'Target 8,786 kJ.'] },
};

test('the setting offers exactly the units this file covers', () => {
  expect(UNIT_OPTIONS.energy.map((o) => o.value).sort()).toEqual(Object.keys(EXPECTED).sort());
});

test.each(Object.entries(EXPECTED))('%s: the screen reads in the chosen energy unit', async (unit, expected) => {
  useSettingsStore.getState().setUnit('energy', unit);
  mockGetWeek.mockResolvedValue(WEEK);
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <EnergyScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  const text = allText(tree);
  expect(text).toContain(expected.net);
  for (const piece of expected.texts) expect(text).toContain(piece);
  // Every Breakdown row carries the chosen unit.
  expect(findAll(tree, (p) => typeof p.label === 'string' && p.unit === unit).length).toBeGreaterThan(0);
  const other = unit === 'kJ' ? 'kcal' : 'kJ';
  expect(text).not.toContain(other);
});
