// Fix 20 (DESIGN_INTENT.md), the one-week rule: a week is Monday to Sunday.
// The shared helper is weekOf (src/lib/data/foodDays.ts), which the Summary
// Workouts card already uses (summaryCards.ts workoutsWeek). It takes a date
// string and never reads the clock. These cases pin its edges; each runs in a
// timezone with a daylight saving change, because weekOf steps through local
// dates and a 23- or 25-hour day must not shift a day out of the week.
import { weekOf } from '@/lib/data/foodDays';

const ZONES = ['UTC', 'Europe/London', 'Australia/Sydney', 'America/New_York'];
const originalTz = process.env.TZ;

afterAll(() => {
  process.env.TZ = originalTz;
});

describe.each(ZONES)('weekOf in %s', (zone) => {
  beforeAll(() => {
    process.env.TZ = zone;
  });

  test('a Monday starts its own week', () => {
    expect(weekOf('2026-11-23')).toEqual([
      '2026-11-23',
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
      '2026-11-28',
      '2026-11-29',
    ]);
  });

  test('a Sunday ends its week', () => {
    const week = weekOf('2026-11-29');
    expect(week[0]).toBe('2026-11-23');
    expect(week[6]).toBe('2026-11-29');
  });

  test('a week crossing a month end', () => {
    expect(weekOf('2026-12-01')).toEqual([
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
      '2026-12-04',
      '2026-12-05',
      '2026-12-06',
    ]);
  });

  test('a leap day', () => {
    expect(weekOf('2028-02-29')).toEqual([
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
      '2028-03-02',
      '2028-03-03',
      '2028-03-04',
      '2028-03-05',
    ]);
  });

  // 2026 changes: London 29 Mar, Sydney 5 Apr and 4 Oct, New York 8 Mar and 1 Nov.
  test.each([
    ['2026-03-29', '2026-03-23'],
    ['2026-04-05', '2026-03-30'],
    ['2026-10-04', '2026-09-28'],
    ['2026-03-08', '2026-03-02'],
    ['2026-11-01', '2026-10-26'],
  ])('a week with a daylight saving change (%s) has seven distinct days from Monday %s', (day, monday) => {
    const week = weekOf(day);
    expect(week).toHaveLength(7);
    expect(new Set(week).size).toBe(7);
    expect(week[0]).toBe(monday);
    expect(week[6]).toBe(day);
  });
});
