// V7 — the Gym month calendar is built from real sessions, by date.
//
// The bug this replaces: the calendar was a 30-slot index array that nothing
// ever filled from the server, so a release build showed an empty grid and the
// line "13-day streak · 0 sessions, 0 freezes" beside a real streak. These pin
// the pure pieces the Gym tab draws from (lib/data/gymRange.ts).
import { intensityOf, monthSummary, monthTitle, monthView } from '@/lib/data/gymRange';
import type { GymSession } from '@/lib/api';

let n = 0;
const row = (date: string, duration_minutes: number | null): GymSession => ({
  id: `s${n++}`,
  user_id: 'u1',
  date,
  name: null,
  notes: null,
  duration_minutes,
  created_at: `${date}T18:00:00Z`,
});

const TODAY = '2026-09-10'; // a Thursday; 1 September 2026 is a Tuesday

describe('intensityOf — minutes trained on the design ramp', () => {
  test('no session is 0', () => expect(intensityOf(0, null)).toBe(0));
  test('a session with no duration is the lowest non-zero band, not a rest day', () =>
    expect(intensityOf(1, null)).toBe(1));
  test('band edges: 30 → 1, 31 → 2, 55 → 2, 56 → 3', () => {
    expect(intensityOf(1, 30)).toBe(1);
    expect(intensityOf(1, 31)).toBe(2);
    expect(intensityOf(1, 55)).toBe(2);
    expect(intensityOf(1, 56)).toBe(3);
  });
});

describe('monthView', () => {
  test('dated cells land under their weekday, Monday first', () => {
    const v = monthView(TODAY, TODAY, [], [], []);
    expect(v.cells[0]).toBeNull(); // Monday 31 Aug belongs to August
    expect(v.cells[1]).toMatchObject({ date: '2026-09-01', day: 1 });
    expect(v.cells.filter(Boolean)).toHaveLength(30);
  });

  test('today is flagged; later days are future, unshaded and never counted', () => {
    const v = monthView(TODAY, TODAY, [row('2026-09-20', 60)], [], []);
    expect(v.cells.find((c) => c?.date === TODAY)).toMatchObject({ today: true, future: false });
    expect(v.cells.find((c) => c?.date === '2026-09-20')).toMatchObject({ future: true, level: 0, sessions: 0 });
    expect(v.sessions).toBe(0);
  });

  test('each logged session shades its own date by minutes', () => {
    const v = monthView(TODAY, TODAY, [row('2026-09-02', 20), row('2026-09-04', 45), row('2026-09-08', 75)], [], []);
    const level = (d: string) => v.cells.find((c) => c?.date === d)!.level;
    expect([level('2026-09-02'), level('2026-09-04'), level('2026-09-08'), level('2026-09-03')]).toEqual([1, 2, 3, 0]);
    expect(v).toMatchObject({ sessions: 3, minutes: 140, untimed: 0 });
  });

  test('two sessions on one day count twice and sum their minutes', () => {
    const v = monthView(TODAY, TODAY, [row('2026-09-05', 30), row('2026-09-05', 30)], [], []);
    expect(v.cells.find((c) => c?.date === '2026-09-05')).toMatchObject({ sessions: 2, minutes: 60, level: 3 });
    expect(v.sessions).toBe(2);
  });

  test('a session without a duration is counted and shaded, but adds no minutes', () => {
    const v = monthView(TODAY, TODAY, [row('2026-09-06', null)], [], []);
    expect(v.cells.find((c) => c?.date === '2026-09-06')).toMatchObject({ sessions: 1, minutes: null, level: 1 });
    expect(v).toMatchObject({ sessions: 1, minutes: 0, untimed: 1 });
  });

  test('a session just logged on this device shows on its real date before the server row exists', () => {
    const v = monthView(TODAY, TODAY, [], [{ date: TODAY, minutes: 45 }], []);
    expect(v.cells.find((c) => c?.date === TODAY)).toMatchObject({ sessions: 1, level: 2 });
    expect(v.sessions).toBe(1);
  });

  test("the server's row replaces the local echo of the same session — never counted twice", () => {
    const v = monthView(TODAY, TODAY, [row(TODAY, 60)], [{ date: TODAY, minutes: 45 }], []);
    expect(v.cells.find((c) => c?.date === TODAY)).toMatchObject({ sessions: 1, minutes: 60, level: 3 });
    expect(v.sessions).toBe(1);
  });

  test('a freeze marks its date; a trained day is never also a freeze; a future freeze waits', () => {
    const v = monthView(TODAY, TODAY, [row('2026-09-08', 40)], [], ['2026-09-07', '2026-09-08', '2026-09-11', '']);
    expect(v.cells.find((c) => c?.date === '2026-09-07')).toMatchObject({ frozen: true, level: 0 });
    expect(v.cells.find((c) => c?.date === '2026-09-08')).toMatchObject({ frozen: false, level: 2 });
    expect(v.cells.find((c) => c?.date === '2026-09-11')).toMatchObject({ frozen: false, future: true });
    expect(v.freezes).toBe(1);
  });

  test('sessions from other months are ignored', () => {
    const v = monthView(TODAY, TODAY, [row('2026-08-31', 60), row('2026-10-01', 60)], [], []);
    expect(v.sessions).toBe(0);
  });
});

describe('monthSummary — the line under the grid', () => {
  const view = (s: GymSession[], frozen: string[] = []) => monthView(TODAY, TODAY, s, [], frozen);
  test("the design's format", () => {
    expect(monthSummary(view([row('2026-09-01', 190), row('2026-09-03', 120)]))).toBe('2 sessions · 5h 10m');
  });
  test('one session is singular; minutes under an hour keep the design shape', () => {
    expect(monthSummary(view([row('2026-09-01', 45)]))).toBe('1 session · 0h 45m');
  });
  test('untimed sessions and freeze days are named, not folded into a number', () => {
    expect(monthSummary(view([row('2026-09-01', 30), row('2026-09-02', null)], ['2026-09-04']))).toBe(
      '2 sessions · 0h 30m · 1 untimed · 1 freeze',
    );
  });
  test('a month with nothing logged says exactly that', () => {
    expect(monthSummary(view([]))).toBe('0 sessions');
  });
});

describe('V7 regression — a real streak must never sit beside a false "0 sessions"', () => {
  test('sessions the server returned are counted even when nothing was logged on this device', () => {
    // A release build: empty local store, a real month of sessions from the API.
    const summary = monthSummary(monthView(TODAY, TODAY, [row('2026-09-08', 50), row('2026-09-09', 65)], [], []));
    expect(summary).toBe('2 sessions · 1h 55m');
    expect(summary).not.toMatch(/^0 sessions/);
  });
});

describe('monthTitle', () => {
  test('the month name alone this year, with the year otherwise', () => {
    expect(monthTitle('2026-09-01', TODAY)).toBe('September');
    expect(monthTitle('2025-12-01', TODAY)).toBe('December 2025');
  });
});
