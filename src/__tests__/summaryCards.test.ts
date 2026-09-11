// V16 — the pure pieces behind Summary's design cards. Every number comes from a
// server row or the user's goals; a value the server could not compute stays
// null and is shown as a dash, never a zero.
import {
  axisMax,
  dayReadout,
  ringFraction,
  todayRow,
  weekStat,
  workoutsLine,
  workoutsWeek,
} from '@/lib/data/summaryCards';
import type { EnergyBalance, GymSession } from '@/lib/api';

const day = (date: string, calories_in: number, out: number | null, net: number | null): EnergyBalance => ({
  date,
  calories_in,
  calories_out_bmr: out == null ? null : 1660,
  calories_out_exercise: out == null ? 0 : out - 1660,
  calories_out_total: out,
  net_balance: net,
  target: 2100,
  variance: calories_in - 2100,
  status: net == null ? 'no_target' : net < 0 ? 'deficit' : 'surplus',
});
let n = 0;
const session = (date: string, duration_minutes: number | null): GymSession => ({
  id: `s${n++}`,
  user_id: 'u1',
  date,
  name: null,
  notes: null,
  duration_minutes,
  created_at: `${date}T18:00:00Z`,
});

test('todayRow picks today out of the window, or nothing', () => {
  const week = [day('2026-09-09', 1500, 2000, -500), day('2026-09-10', 1240, 1864, -624)];
  expect(todayRow(week, '2026-09-10')?.calories_in).toBe(1240);
  expect(todayRow(week, '2026-09-11')).toBeNull();
  expect(todayRow(undefined, '2026-09-10')).toBeNull();
});

test('axisMax rounds up to the step and ignores missing values', () => {
  expect(axisMax([1240, 1864, 2100], 400)).toBe(2400);
  expect(axisMax([null, undefined], 400)).toBe(400);
  expect(axisMax([-624, 300], 200)).toBe(800);
});

test('weekStat: average intake, and average net over the days the server computed', () => {
  const week = [day('2026-09-08', 1000, 2000, -1000), day('2026-09-09', 2000, null, null), day('2026-09-10', 3000, 2500, 500)];
  expect(weekStat(week, 'inout')).toBe(2000);
  expect(weekStat(week, 'net')).toBe(-250); // the uncomputable day is left out, not counted as 0
  expect(weekStat([day('2026-09-09', 2000, null, null)], 'net')).toBeNull();
  expect(weekStat([], 'inout')).toBeNull();
});

test('dayReadout dashes what the server could not compute', () => {
  const fmt = (v: number) => String(Math.round(v));
  expect(dayReadout(day('2026-09-10', 1240, 1864, -624), fmt)).toMatch(/· in 1240 · burned 1864 · net −624$/);
  expect(dayReadout(day('2026-09-10', 1240, null, null), fmt)).toMatch(/· in 1240 · burned — · net —$/);
});

test('workoutsWeek: this calendar week only, minutes that were recorded, untimed counted apart', () => {
  // Thursday 10 Sept 2026: the week runs Mon 7 → Sun 13.
  const rows = [
    session('2026-09-06', 50), // last week — not counted
    session('2026-09-07', 45),
    session('2026-09-09', null),
    session('2026-09-10', 60),
    session('2026-09-12', 30), // a future day this week — nothing has happened on it
  ];
  const w = workoutsWeek(rows, '2026-09-10');
  expect(w).toMatchObject({ sessions: 3, minutes: 105, untimed: 1 });
  expect(w.pips.map((p) => p.letter).join('')).toBe('MTWTFSS');
  expect(w.pips.map((p) => p.trained)).toEqual([true, false, true, true, false, false, false]);
  expect(workoutsLine(w)).toBe('1h 45m trained · 1 without a duration');
});

test('workoutsLine says so when nothing was logged, instead of "0 kcal burned"', () => {
  expect(workoutsLine(workoutsWeek([], '2026-09-10'))).toBe('No sessions yet this week');
});

test('ringFraction draws an empty ring without a target', () => {
  expect(ringFraction(1240, null)).toBe(0);
  expect(ringFraction(1240, 0)).toBe(0);
  expect(ringFraction(1050, 2100)).toBe(0.5);
  expect(ringFraction(5000, 2100)).toBe(1);
});
