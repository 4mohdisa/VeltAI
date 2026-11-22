// useEnergyRange (src/lib/data/energyRange.ts), the real hook: two week reads
// seven days apart, merged into one oldest-first series. Covers what it returns
// for no data, a single day, a full fourteen-day range and a range with a
// missing day (no row is invented for it, and a day the server could not
// compute keeps its nulls). @/lib/api is mocked at the module boundary and the
// clock is pinned, so the two week end dates are known.
import { useEnergyRange } from '@/lib/data/energyRange';
import type { EnergyBalance, WeeklyEnergyBalance } from '@/lib/types';

import { readHook } from './helpers/useApiHarness';

const mockGetWeek = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { energy: { getWeek: (...args: unknown[]) => mockGetWeek(...args) } },
}));

const TODAY = '2026-01-20';
const WEEK_BEFORE = '2026-01-13';

// setImmediate stays real: the harness settles the hook's promises with it.
jest.useFakeTimers({ doNotFake: ['setImmediate'] }).setSystemTime(new Date(2026, 0, 20, 12, 0, 0));

const day = (date: string, overrides: Partial<EnergyBalance> = {}): EnergyBalance => ({
  date,
  calories_in: 1900,
  calories_out_bmr: 1500,
  calories_out_exercise: 200,
  calories_out_total: 1700,
  net_balance: 200,
  target: 2100,
  variance: null,
  status: 'surplus',
  ...overrides,
});

const weekly = (days: EnergyBalance[]): WeeklyEnergyBalance => ({
  days,
  weekly_average_in: 0,
  weekly_average_out: 0,
  weekly_net: 0,
});

/** `n` consecutive dates in January 2026, starting on the `from`th. */
const january = (from: number, n: number) =>
  Array.from({ length: n }, (_, i) => `2026-01-${String(from + i).padStart(2, '0')}`);

/** Answer each week read by its end date; an unlisted end date has no days. */
const serveWeeks = (byEnd: Record<string, EnergyBalance[]>) =>
  mockGetWeek.mockImplementation((end: string) => Promise.resolve(weekly(byEnd[end] ?? [])));

beforeEach(() => mockGetWeek.mockReset());

test('asks for the week ending today and the week ending seven days earlier', async () => {
  serveWeeks({});
  await readHook(useEnergyRange);
  expect(mockGetWeek.mock.calls.map(([end]) => end).sort()).toEqual([WEEK_BEFORE, TODAY]);
});

test('no data: an empty series, not an error', async () => {
  serveWeeks({});
  expect(await readHook(useEnergyRange)).toMatchObject({ days: [], loading: false, isError: false });
});

test('a single day: exactly that one day', async () => {
  const only = day(TODAY);
  serveWeeks({ [TODAY]: [only] });
  expect(await readHook(useEnergyRange)).toMatchObject({ days: [only], loading: false, isError: false });
});

test('a normal range: fourteen days oldest first, the fresher read winning a shared date', async () => {
  const earlier = january(7, 7).map((d) => day(d, { calories_in: 1000 }));
  const recent = january(14, 7).map((d) => day(d, { calories_in: 2000 }));
  // The week-before read also returns the 14th; the recent read is fresher.
  const stale = day('2026-01-14', { calories_in: 1 });
  serveWeeks({ [WEEK_BEFORE]: [...earlier, stale], [TODAY]: recent });

  const range = await readHook(useEnergyRange);
  expect(range?.days.map((d) => d.date)).toEqual(january(7, 14));
  expect(range?.days.find((d) => d.date === '2026-01-14')?.calories_in).toBe(2000);
  expect(range?.isError).toBe(false);
});

test('a missing day: no row is invented for it, and a day without a burn keeps its nulls', async () => {
  const recent = january(14, 7)
    .filter((d) => d !== '2026-01-17')
    .map((d) => (d === '2026-01-18' ? day(d, { calories_out_total: null, net_balance: null }) : day(d)));
  serveWeeks({ [WEEK_BEFORE]: january(7, 7).map((d) => day(d)), [TODAY]: recent });

  const range = await readHook(useEnergyRange);
  const dates = range?.days.map((d) => d.date) ?? [];
  expect(dates).toHaveLength(13);
  expect(dates).not.toContain('2026-01-17');
  expect(dates).toEqual([...dates].sort());
  expect(range?.days.find((d) => d.date === '2026-01-18')).toMatchObject({ calories_out_total: null, net_balance: null });
});
