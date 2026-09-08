/// <reference types="jest" />
/// <reference types="node" />
// The food log used to hold exactly one day — today — and every write stamped
// today implicitly (architecture item 3). It is now keyed by date, and a write
// takes an explicit target day.
//
// The regressions this guards are all silent ones: a row landing on the wrong
// day, a scan resolving onto a day the user has since navigated away from, an
// offline write replaying with the date of the REPLAY rather than the date it
// was logged, or one day's totals leaking into another's.
import { readFileSync } from 'fs';
import { join } from 'path';

import { logInputFromItem } from '@/lib/data/mappers';
import { useFoodStore, selectedFoodDate } from '@/lib/data/foodStore';

const ITEM = { name: 'Test oats', quantityG: 100, calories: 200, protein: 10, carbs: 30, fat: 4 };
const OTHER_DAY = '2026-01-15';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

beforeEach(() => {
  useFoodStore.getState().reset();
});

describe('the store knows which day it is showing', () => {
  test('it starts on today, and `meals` mirrors that day', () => {
    const s = useFoodStore.getState();
    expect(s.selectedDate).toBe(today());
    expect(s.meals).toEqual(s.byDate[today()] ?? []);
    expect(selectedFoodDate()).toBe(today());
  });

  test('selecting another day swaps what `meals` shows', () => {
    useFoodStore.getState().setSelectedDate(OTHER_DAY);
    expect(useFoodStore.getState().selectedDate).toBe(OTHER_DAY);
    // Never fetched, so genuinely empty — NOT today's rows under a new label.
    expect(useFoodStore.getState().meals).toEqual([]);
  });

  test('switching back restores the first day from cache, not a refetch', () => {
    const before = useFoodStore.getState().meals;
    useFoodStore.getState().setSelectedDate(OTHER_DAY);
    useFoodStore.getState().setSelectedDate(today());
    expect(useFoodStore.getState().meals).toEqual(before);
  });

  test('setDayMeals fills a day without disturbing the visible one', () => {
    const visible = useFoodStore.getState().meals;
    useFoodStore.getState().setDayMeals(OTHER_DAY, []);
    expect(useFoodStore.getState().meals).toEqual(visible);
    expect(useFoodStore.getState().byDate[OTHER_DAY]).toEqual([]);
  });
});

describe('a write lands on the day it was told to', () => {
  test('an explicit date wins over the selected day', () => {
    useFoodStore.getState().logMeal('Lunch', ITEM, 'manual', false, OTHER_DAY);
    const s = useFoodStore.getState();
    expect(JSON.stringify(s.byDate[OTHER_DAY])).toContain('Test oats');
    // The day on screen is untouched.
    expect(JSON.stringify(s.meals)).not.toContain('Test oats');
  });

  test('with no date it lands on the day being shown, not on today', () => {
    useFoodStore.getState().setSelectedDate(OTHER_DAY);
    useFoodStore.getState().logMeal('Lunch', ITEM, 'manual');
    const s = useFoodStore.getState();
    expect(JSON.stringify(s.byDate[OTHER_DAY])).toContain('Test oats');
    expect(JSON.stringify(s.byDate[today()] ?? [])).not.toContain('Test oats');
  });

  test("one day's totals never leak into another's", () => {
    useFoodStore.getState().logMeal('Lunch', ITEM, 'manual', false, OTHER_DAY);
    const other = useFoodStore.getState().byDate[OTHER_DAY];
    const lunch = other.find((m) => m.slot === 'Lunch');
    expect(lunch?.calories).toBe(ITEM.calories);

    const todayLunchBefore = (useFoodStore.getState().byDate[today()] ?? []).find((m) => m.slot === 'Lunch');
    useFoodStore.getState().logMeal('Lunch', ITEM, 'manual', false, OTHER_DAY);
    const todayLunchAfter = (useFoodStore.getState().byDate[today()] ?? []).find((m) => m.slot === 'Lunch');
    expect(todayLunchAfter?.calories).toBe(todayLunchBefore?.calories);
    // The other day accumulated both.
    expect(useFoodStore.getState().byDate[OTHER_DAY].find((m) => m.slot === 'Lunch')?.calories).toBe(
      ITEM.calories * 2,
    );
  });
});

describe('a row is addressed by id on whatever day holds it', () => {
  // The real case: a scan starts on one day and resolves after the user has
  // swiped to another. Scoping mutations to the visible day would drop it.
  test('an item on a NON-selected day can still be edited', () => {
    const id = useFoodStore.getState().logMeal('Lunch', ITEM, 'manual', false, OTHER_DAY);
    useFoodStore.getState().setSelectedDate(today());
    useFoodStore.getState().editFoodItem(id, { name: 'Renamed while away' });
    expect(JSON.stringify(useFoodStore.getState().byDate[OTHER_DAY])).toContain('Renamed while away');
  });

  test('an item on a NON-selected day can still be deleted', () => {
    const id = useFoodStore.getState().logMeal('Lunch', ITEM, 'manual', false, OTHER_DAY);
    useFoodStore.getState().setSelectedDate(today());
    useFoodStore.getState().deleteFoodItem(id);
    expect(JSON.stringify(useFoodStore.getState().byDate[OTHER_DAY] ?? [])).not.toContain('Test oats');
  });

  test('a pending scan resolves onto its own day', () => {
    const id = useFoodStore.getState().logMeal('Lunch', ITEM, 'photo', true, OTHER_DAY);
    useFoodStore.getState().setSelectedDate(today());
    useFoodStore.getState().resolvePending(id, { ...ITEM, name: 'Resolved dish' });
    const rows = useFoodStore.getState().byDate[OTHER_DAY];
    expect(JSON.stringify(rows)).toContain('Resolved dish');
    expect(rows.flatMap((m) => m.items).find((it) => it.id === id)?.pending).toBe(false);
  });

  test('a scan status flips on its own day', () => {
    const id = useFoodStore.getState().logMeal('Lunch', ITEM, 'photo', true, OTHER_DAY);
    useFoodStore.getState().setSelectedDate(today());
    useFoodStore.getState().setItemStatus(id, 'ready');
    const rows = useFoodStore.getState().byDate[OTHER_DAY];
    expect(rows.flatMap((m) => m.items).find((it) => it.id === id)?.status).toBe('ready');
  });
});

describe('the wire body carries the day it was logged on', () => {
  test('logInputFromItem uses the date it is given, not today', () => {
    const body = logInputFromItem('Lunch', ITEM, 'manual', OTHER_DAY);
    expect(body.date).toBe(OTHER_DAY);
  });

  test("this is what stops an offline write replaying under the replay's date", () => {
    // The body is built once, at log time, and the offline queue replays that
    // exact body. Before this change the date was computed inside the mapper
    // from the clock, so a write queued on Monday and flushed on Tuesday landed
    // on Tuesday.
    const body = logInputFromItem('Breakfast', ITEM, 'photo', '2026-03-01');
    expect(JSON.parse(JSON.stringify(body)).date).toBe('2026-03-01');
  });
});

describe('sign-out and release-build posture are unchanged', () => {
  test('reset clears EVERY cached day, not just the visible one', () => {
    useFoodStore.getState().logMeal('Lunch', ITEM, 'manual', false, OTHER_DAY);
    useFoodStore.getState().reset();
    expect(useFoodStore.getState().byDate[OTHER_DAY]).toBeUndefined();
    expect(useFoodStore.getState().selectedDate).toBe(today());
  });

  test('the dev seed belongs to today only — no other day is pre-filled', () => {
    const { byDate } = useFoodStore.getState();
    for (const day of Object.keys(byDate)) {
      expect(day).toBe(today());
    }
  });
});

describe('the date helpers behind the week strip and calendar', () => {
  // These are the classic timezone traps. `new Date('2026-01-15')` parses as
  // UTC, so west of Greenwich it is the 14th — which would file a log under the
  // wrong day and light the wrong dot.
  const { isoDate, fromIso, addDays, weekOf, monthGrid, addMonths } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/lib/data/foodDays') as typeof import('@/lib/data/foodDays');

  test('fromIso round-trips through isoDate in the LOCAL calendar', () => {
    expect(isoDate(fromIso('2026-01-15'))).toBe('2026-01-15');
    expect(fromIso('2026-01-15').getDate()).toBe(15);
  });

  test('addDays crosses a month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('addDays crosses a leap day correctly', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  test('weekOf returns seven days, Monday first, containing the given day', () => {
    // 2026-01-15 is a Thursday.
    const week = weekOf('2026-01-15');
    expect(week).toHaveLength(7);
    expect(week[0]).toBe('2026-01-12'); // Monday
    expect(week[6]).toBe('2026-01-18'); // Sunday
    expect(week).toContain('2026-01-15');
  });

  test('weekOf treats Sunday as the END of its week, not the start', () => {
    // 2026-01-18 is a Sunday; it must belong to the week starting the 12th.
    expect(weekOf('2026-01-18')[0]).toBe('2026-01-12');
  });

  test('monthGrid pads so the first of the month sits under its weekday', () => {
    // 2026-01-01 is a Thursday → three blanks (Mon, Tue, Wed) precede it.
    const cells = monthGrid('2026-01-10');
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]).toBe('2026-01-01');
    expect(cells.filter(Boolean)).toHaveLength(31);
  });

  test('monthGrid covers February in a leap year', () => {
    expect(monthGrid('2028-02-10').filter(Boolean)).toHaveLength(29);
  });

  test('addMonths clamps rather than overflowing into the next month', () => {
    // Jan 31 + 1 month has no 31st to land on; it must not become March 3rd.
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
  });
});

// --- the calendar dots come from a bounded endpoint --------------------------
// `useLoggedDays` used to answer "which days have a dot?" by calling
// GET /api/food/logs with no date, which returns EVERY row the user has ever
// logged — each with its macros and its scan_results blob — just to read the
// `date` off each one. It now calls GET /api/food/days, which returns the
// distinct dates and nothing else.
describe('logged days are fetched as dates, not as the whole history', () => {
  const read = (p: string) => readFileSync(join(__dirname, '../..', p), 'utf8');

  test('useLoggedDays calls the days endpoint', () => {
    const src = read('src/lib/data/foodDays.ts');
    expect(src).toContain('api.foodLogs\n      .days()');
  });

  test('no source fetches the unfiltered food log any more', () => {
    // A `list()` with no argument is the unbounded call this replaced. Every
    // surviving caller must name a date.
    for (const p of ['src/lib/data/foodDays.ts', 'src/lib/data/hooks.ts', 'src/app/(tabs)/food.tsx']) {
      expect(read(p)).not.toMatch(/foodLogs\s*\.?\s*\n?\s*\.list\(\s*\)/);
    }
  });

  test('the api client exposes days with an optional from/to window', () => {
    const src = read('src/lib/api.ts');
    expect(src).toContain("req.get<string[]>('/api/food/days'");
    expect(src).toMatch(/from: range\?\.from, to: range\?\.to/);
  });
});
