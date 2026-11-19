// fetchWeeklyMacros, the data step behind useWeeklyMacros (PHASE2_ROWS.md row
// 21 — chart wiring is the next step). api.foodLogs.list is mocked; no network.
/* eslint-disable import/first -- jest.mock must be hoisted above the imports it replaces */
jest.mock('@/lib/api', () => ({ api: { foodLogs: { list: jest.fn() } } }));

import { api } from '@/lib/api';
import { fetchWeeklyMacros } from '@/lib/data/hooks';
import { addDays, isoDate } from '@/lib/data/foodDays';

const listMock = api.foodLogs.list as jest.Mock;

const today = isoDate(new Date());
const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

const row = (protein: number, carbs: number, fat: number, fibre: number) => ({ protein, carbs, fat, fibre });

beforeEach(() => {
  listMock.mockReset();
  listMock.mockImplementation(({ date }: { date: string }) => {
    // Two of the seven days have logged rows; the rest have none.
    if (date === dates[1]) return Promise.resolve([row(10, 20, 5, 2), row(5, 10, 2, 1)]);
    if (date === dates[5]) return Promise.resolve([row(30, 40, 10, 4)]);
    return Promise.resolve([]);
  });
});

test("returns the last 7 days oldest first, each day's macros summed from its own rows", async () => {
  const days = await fetchWeeklyMacros();

  expect(days).toHaveLength(7);
  expect(days.map((d) => d.date)).toEqual(dates);

  expect(days[1]).toEqual({ date: dates[1], protein: 15, carbs: 30, fat: 7, fibre: 3 });
  expect(days[5]).toEqual({ date: dates[5], protein: 30, carbs: 40, fat: 10, fibre: 4 });

  for (const i of [0, 2, 3, 4, 6]) {
    expect(days[i]).toEqual({ date: dates[i], protein: 0, carbs: 0, fat: 0, fibre: 0 });
  }
});
