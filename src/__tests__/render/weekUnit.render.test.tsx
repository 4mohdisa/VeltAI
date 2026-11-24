// The This week detail screen follows the energy unit setting: every number and
// unit on it reads in kcal or kJ as chosen, instead of always saying "kcal". The
// real useEnergyRange hook runs against a mocked API client, as in
// week.axisLetters.render.test.tsx.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import WeekDetailScreen from '@/app/dashboard/week';
import { useSettingsStore } from '@/lib/settings/store';
import type { EnergyBalance, WeeklyEnergyBalance } from '@/lib/types';
import { UNIT_OPTIONS, type EnergyUnit } from '@/lib/units';
import { act, allText, findAll, renderScreen } from './helpers';

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

const startUnit = useSettingsStore.getState().units.energy;
afterAll(() => {
  useSettingsStore.getState().setUnit('energy', startUnit);
});

// Every day: 2,000 eaten, 1,800 burned, net +200, target 2,100.
// In kJ (× 4.184): 8,368, 7,531, +837 and 8,786.
const EXPECTED: Record<EnergyUnit, string[]> = {
  kcal: ['kcal in per day', '2,000 kcal average', 'Target 2,100 kcal.', 'In 2,000 · burned 1,800', '+200'],
  kJ: ['kJ in per day', '8,368 kJ average', 'Target 8,786 kJ.', 'In 8,368 · burned 7,531', '+837'],
};

test('the setting offers exactly the units this file covers', () => {
  expect(UNIT_OPTIONS.energy.map((o) => o.value).sort()).toEqual(Object.keys(EXPECTED).sort());
});

test.each(Object.entries(EXPECTED))('%s: the week screen reads in the chosen energy unit', async (unit, expected) => {
  useSettingsStore.getState().setUnit('energy', unit);
  mockGetWeek.mockResolvedValue(WEEK);
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <WeekDetailScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  const text = allText(tree);
  for (const piece of expected) expect(text).toContain(piece);
  // Every Breakdown row with a net carries the chosen unit.
  expect(findAll(tree, (p) => typeof p.label === 'string' && p.unit === unit).length).toBeGreaterThan(0);
  expect(text).not.toContain(unit === 'kJ' ? 'kcal' : 'kJ');
});
