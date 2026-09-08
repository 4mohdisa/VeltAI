// The four Summary detail views, rendered whole.
//
// These snapshots exist for ONE job: the chart chrome (Plot / Axis / ChartHeader
// / KickerTitle / StatLine / BreakdownRow) was copied verbatim into all four
// routes and is being hoisted into src/components/display/DetailChart.tsx. That
// is a pure refactor, so the rendered host tree — every View, every style object,
// every accessibility label — must come out byte-identical afterwards.
//
// The snapshots were written from the PRE-extraction sources and are the
// before/after evidence: if the extraction changed one padding value or dropped
// one accessibilityLabel, these fail.
//
// The data hooks are mocked with fixed rows (never random, never Date.now) so a
// snapshot is a function of the components alone. The fixtures deliberately mix
// computed days with days the server could not compute, so the GAP branches —
// the ones most likely to be broken by a careless extraction — are in the tree.
import type { EnergyBalance } from '@/lib/types';
import type { GymSession } from '@/lib/api';

// --- fixtures ----------------------------------------------------------------
// Fourteen days ending on a fixed date. Days 3 and 9 have no computed burn or
// net: those are the gaps.

const day = (over: Partial<EnergyBalance> & { date: string }): EnergyBalance => ({
  calories_in: 0,
  calories_out_bmr: null,
  calories_out_exercise: 0,
  calories_out_total: null,
  net_balance: null,
  target: null,
  variance: null,
  status: 'no_target',
  ...over,
});

const mockDates = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(2026, 7, 26 + i); // 26 Aug 2026 .. 8 Sep 2026, local
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

const mockEnergyDays: EnergyBalance[] = mockDates.map((date, i) =>
  i === 3 || i === 9
    ? day({ date, calories_in: 1700 + i * 10 }) // uncomputable: a gap, not a zero
    : day({
        date,
        calories_in: 1800 + i * 25,
        calories_out_bmr: 1500,
        calories_out_exercise: i % 3 === 0 ? 320 : 0,
        calories_out_total: 1820 + i * 10,
        net_balance: 1800 + i * 25 - (1820 + i * 10),
        target: 2100,
        status: 'on_target',
      }),
);

const mockSessions: GymSession[] = [
  { id: 's1', user_id: 'u1', date: mockDates[13], name: 'Push day', notes: null, duration_minutes: 52, created_at: `${mockDates[13]}T09:00:00Z` },
  { id: 's2', user_id: 'u1', date: mockDates[11], name: 'Pull day', notes: null, duration_minutes: 47, created_at: `${mockDates[11]}T09:00:00Z` },
  // Logged but never timed — the training hero must leave this day blank.
  { id: 's3', user_id: 'u1', date: mockDates[9], name: 'Legs', notes: null, duration_minutes: null, created_at: `${mockDates[9]}T09:00:00Z` },
];

// --- mocks -------------------------------------------------------------------
// Only the HOOKS are mocked. Every pure helper the screens use for their
// numbers (netOf, burnOf, mean, dayMonth, minutesByDate…) stays real, so the
// snapshot exercises the actual arithmetic.

jest.mock('@/lib/data/energyRange', () => ({
  ...jest.requireActual('@/lib/data/energyRange'),
  useEnergyRange: () => ({ days: mockEnergyDays, loading: false, refetch: jest.fn() }),
}));

jest.mock('@/lib/data/gymRange', () => ({
  ...jest.requireActual('@/lib/data/gymRange'),
  useGymRange: () => ({ sessions: mockSessions, dates: mockDates, loading: false, refetch: jest.fn() }),
}));

jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useDailyMacros: () => ({
    calories: { consumed: 1840, target: 2100 },
    protein: { consumed: 120, target: 150 },
    carbs: { consumed: 210, target: 240 },
    fat: { consumed: 62, target: 70 },
    fibre: { consumed: 0, target: 30 },
  }),
  useFoodLog: () => ({
    data: [
      { id: 'm1', slot: 'Breakfast', time: '08:10', calories: 420, protein: 28, carbs: 45, fat: 12, items: [] },
      { id: 'm2', slot: 'Lunch', time: '13:05', calories: 680, protein: 44, carbs: 70, fat: 22, items: [] },
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

// formatRelativeDate says "Today"/"Yesterday" against the real clock, which
// would make these snapshots expire overnight. Pinned to the fixture window.
jest.useFakeTimers().setSystemTime(new Date(2026, 8, 8, 12, 0, 0));

/* eslint-disable import/first -- The screens must be imported BELOW the fixtures
   above. jest.mock factories are hoisted but run lazily, when the mocked module
   is first required — which is during a screen's own import. Hoisting these
   imports to the top of the file would run the factories before `mockDates` and
   friends are initialised, and they would throw on the temporal dead zone. */
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import EnergyScreen from '@/app/energy';
import WeekDetailScreen from '@/app/dashboard/week';
import TrainingDetailScreen from '@/app/dashboard/training';
import NutritionDetailScreen from '@/app/dashboard/nutrition';
import { renderScreen } from './helpers';

// Screen reads useSafeAreaInsets. Fixed iPhone-with-notch metrics, so the
// padding in the snapshot is a constant rather than the harness's default.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const snapshotOf = (el: ReactElement) =>
  renderScreen(<SafeAreaProvider initialMetrics={METRICS}>{el}</SafeAreaProvider>).toJSON();

describe('the four Summary detail views render identically across the chrome extraction', () => {
  test('energy balance', () => {
    expect(snapshotOf(<EnergyScreen />)).toMatchSnapshot();
  });

  test('this week', () => {
    expect(snapshotOf(<WeekDetailScreen />)).toMatchSnapshot();
  });

  test('training', () => {
    expect(snapshotOf(<TrainingDetailScreen />)).toMatchSnapshot();
  });

  test('macros', () => {
    expect(snapshotOf(<NutritionDetailScreen />)).toMatchSnapshot();
  });
});
