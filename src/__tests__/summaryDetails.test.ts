/// <reference types="jest" />
/// <reference types="node" />
// The four Summary detail views (energy / week / training / macros) share one
// layout and one rule: every value on screen traces to a server row, and a day
// the server could not compute is a GAP, never a zero.
//
// This is the `node` jest project, so the screens can only be read as TEXT (they
// import react-native). The pure helpers behind them ARE imported and exercised
// directly — which is why they live in src/lib/data/*Range.ts rather than inside
// the screens.
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

import { burnOf, dayMonth, lastNDates, mean, mergeDays, netOf, shiftISO } from '@/lib/data/energyRange';
import { minutesByDate, sessionsOn } from '@/lib/data/gymRange';
import type { EnergyBalance, GymSession } from '@/lib/api';

const root = join(__dirname, '../..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');
/** Source with comments stripped — prose about a number is not a rendered number. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const ROUTES = {
  energy: 'src/app/energy.tsx',
  week: 'src/app/dashboard/week.tsx',
  training: 'src/app/dashboard/training.tsx',
  macros: 'src/app/dashboard/nutrition.tsx',
} as const;

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

const session = (over: Partial<GymSession> & { date: string }): GymSession => ({
  id: `s-${over.date}`,
  user_id: 'u1',
  name: null,
  notes: null,
  duration_minutes: null,
  created_at: `${over.date}T00:00:00Z`,
  ...over,
});

describe('all four Summary detail routes exist', () => {
  test.each(Object.entries(ROUTES))('%s route file is present', (_key, path) => {
    expect(existsSync(join(root, path))).toBe(true);
  });

  test.each(Object.entries(ROUTES))('%s default-exports a screen', (_key, path) => {
    expect(read(path)).toMatch(/export default function \w+/);
  });

  // The layout is the point: one kicker + one Breakdown card on every view.
  test.each(Object.entries(ROUTES))('%s renders the shared kicker and Breakdown', (key, path) => {
    const src = read(path);
    expect(src).toContain('<KickerTitle');
    if (key === 'week' || key === 'training') {
      expect(src).toContain("t('dashboard.breakdown')");
      expect(code(path)).not.toMatch(/\bBreakdown\b/);
    } else {
      expect(src).toContain('Breakdown');
    }
  });

  // Pushed routes cover the floating tab bar; padding for it would leave a gap.
  test.each(Object.entries(ROUTES))('%s does not pad for the tab bar', (_key, path) => {
    expect(read(path)).not.toContain('TAB_BAR_CLEARANCE');
  });

  test('the Summary tab links to all four', () => {
    // V16: three of the links moved into the design cards Summary mounts. Same
    // guarantee — every detail is reachable from Summary — pinned where it lives.
    const src = read('src/app/(tabs)/index.tsx');
    expect(src).toContain('/dashboard/nutrition');
    for (const card of ['<EnergyBalanceCard', '<WeekEnergyCard', '<WorkoutsWeekCard']) expect(src).toContain(card);
    expect(read('src/components/domain/WeekEnergyCard.tsx')).toContain("'/dashboard/week'");
    expect(read('src/components/domain/WorkoutsWeekCard.tsx')).toContain("'/dashboard/training'");
    expect(read('src/components/domain/EnergyBalanceCard.tsx')).toContain("'/energy'");
  });
});

describe('the chart chrome lives in one file', () => {
  // Each of the four routes used to carry its own byte-identical copy of Plot /
  // Axis / ChartHeader / KickerTitle / StatLine / BreakdownRow — ~200 lines
  // apiece, flagged by a `ponytail:` comment in three of them. They now import
  // it. This guards the extraction: a route that redeclares any of it has
  // started a fifth copy.
  const CHROME = 'src/components/display/DetailChart.tsx';
  const SHARED = ['Plot', 'Axis', 'ChartHeader', 'KickerTitle', 'StatLine', 'BreakdownRow', 'heroLabels'];

  test('DetailChart.tsx exports every shared piece', () => {
    const src = read(CHROME);
    for (const name of SHARED) {
      expect(src).toMatch(new RegExp(`export function ${name}\\b`));
    }
    // The plot geometry is shared too, so the four cards line up with each other.
    expect(src).toContain('export const HERO_H');
    expect(src).toContain('export const SEC_H');
  });

  test.each(Object.entries(ROUTES))('%s imports the chrome instead of declaring it', (_key, path) => {
    const src = code(path);
    expect(src).toContain("from '@/components/display/DetailChart'");
    for (const name of SHARED) {
      expect(src).not.toMatch(new RegExp(`function ${name}\\s*\\(`));
    }
  });

  test('no detail route still carries the ponytail marker that asked for this', () => {
    for (const path of Object.values(ROUTES)) {
      expect(read(path)).not.toMatch(/ponytail: the layout chrome/);
    }
  });

  // The chrome is now a place a fabricated number could hide from the per-route
  // grep below, so it is held to the same rule.
  test('the shared chrome hardcodes no measurement either', () => {
    const offenders = code(CHROME).match(/[^\w.]\d[\d,]*\s?(kcal|kJ|steps|min|sessions|g)\b/gi) ?? [];
    expect(offenders).toEqual([]);
  });
});

describe('no detail view hardcodes a measurement', () => {
  // The failure this guards is the one that has hit this codebase repeatedly: a
  // plausible-looking number typed into JSX and read by a user as their own.
  // Chart geometry composed from the spacing scale is fine; a bare number next
  // to a unit inside a template literal or a JSX text node is not.
  test.each(Object.entries(ROUTES))('%s has no literal number beside a unit', (_key, path) => {
    const src = code(path);
    const offenders = src.match(/[^\w.]\d[\d,]*\s?(kcal|kJ|steps|min|sessions|g)\b/gi) ?? [];
    expect(offenders).toEqual([]);
  });

  test.each(Object.entries(ROUTES))('%s states no weekly session or burn target', (_key, path) => {
    const src = code(path);
    // Both figures are logged in UI_PASS_GAPS.md as having no source.
    expect(src).not.toMatch(/of 5 sessions/);
    expect(src).not.toMatch(/2,?400/);
  });

  test('no detail view renders a step count — the Apple Health seam is a no-op', () => {
    for (const path of Object.values(ROUTES)) {
      expect(code(path)).not.toMatch(/(['"`>])Steps\b/);
    }
  });
});

describe('an uncomputed day is a gap, never a zero', () => {
  const uncomputed = day({ date: '2026-09-01', calories_in: 1800 });
  const computed = day({
    date: '2026-09-02',
    calories_in: 1800,
    calories_out_bmr: 1500,
    calories_out_total: 2400,
    net_balance: -600,
  });

  test('burnOf and netOf pass the server nulls through untouched', () => {
    expect(burnOf(uncomputed)).toBeNull();
    expect(netOf(uncomputed)).toBeNull();
    expect(burnOf(computed)).toBe(2400);
    expect(netOf(computed)).toBe(-600);
  });

  test('neither helper falls back to 0 or to calories_out_exercise', () => {
    const exerciseOnly = day({ date: '2026-09-03', calories_out_exercise: 400 });
    expect(burnOf(exerciseOnly)).not.toBe(0);
    expect(burnOf(exerciseOnly)).not.toBe(400);
    expect(burnOf(exerciseOnly)).toBeNull();
  });

  test('mean of nothing is null, so an empty week never reads as an average of 0', () => {
    expect(mean([])).toBeNull();
    expect(mean([1800, 2200])).toBe(2000);
  });

  test('the screens filter nulls out rather than defaulting them', () => {
    // `?? 0` on a net or burn is the exact coercion this whole suite exists for.
    for (const path of [ROUTES.energy, ROUTES.week]) {
      expect(read(path)).not.toMatch(/netOf\([^)]*\)\s*\?\?\s*0/);
      expect(read(path)).not.toMatch(/net_balance\s*\?\?\s*0/);
    }
  });
});

describe('date helpers', () => {
  test('shiftISO moves whole days and never slides a timezone', () => {
    expect(shiftISO('2026-09-08', -7)).toBe('2026-09-01');
    expect(shiftISO('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftISO('2026-01-01', -1)).toBe('2025-12-31');
  });

  test('shiftISO returns a non-date unchanged instead of producing NaN', () => {
    expect(shiftISO('not-a-date', -1)).toBe('not-a-date');
  });

  test('lastNDates gives n days ending on `end`, oldest first', () => {
    const d = lastNDates('2026-09-08', 14);
    expect(d).toHaveLength(14);
    expect(d[0]).toBe('2026-08-26');
    expect(d[13]).toBe('2026-09-08');
  });

  test('dayMonth formats the 14-day axis label', () => {
    expect(dayMonth('2026-08-09')).toBe('9 Aug');
  });
});

describe('mergeDays stitches the two 7-day windows into 14 real days', () => {
  test('dedupes by date, keeps the fresher window, and sorts oldest first', () => {
    const older = [day({ date: '2026-09-02', calories_in: 1 }), day({ date: '2026-09-01', calories_in: 2 })];
    const recent = [day({ date: '2026-09-02', calories_in: 99 }), day({ date: '2026-09-03', calories_in: 3 })];
    const merged = mergeDays(older, recent);
    expect(merged.map((d) => d.date)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
    expect(merged[1].calories_in).toBe(99);
  });

  test('a failed window contributes nothing rather than breaking the series', () => {
    expect(mergeDays(undefined, [day({ date: '2026-09-01' })]).map((d) => d.date)).toEqual(['2026-09-01']);
    expect(mergeDays(undefined, undefined)).toEqual([]);
  });
});

describe('training minutes', () => {
  const dates = ['2026-09-06', '2026-09-07', '2026-09-08'];

  test('a day with no session is a real 0, not a gap', () => {
    expect(minutesByDate([], dates)).toEqual([0, 0, 0]);
  });

  test('a session with no recorded duration is a gap, not a zero-minute session', () => {
    const rows = [session({ date: '2026-09-07' })];
    expect(minutesByDate(rows, dates)).toEqual([0, null, 0]);
  });

  test('multiple sessions in a day sum, and untimed ones do not drag the sum down', () => {
    const rows = [
      session({ date: '2026-09-08', duration_minutes: 45 }),
      session({ date: '2026-09-08', duration_minutes: 20 }),
      session({ date: '2026-09-08' }),
    ];
    expect(minutesByDate(rows, dates)).toEqual([0, 0, 65]);
  });

  test('sessionsOn picks only that calendar day', () => {
    const rows = [session({ date: '2026-09-07' }), session({ date: '2026-09-08' })];
    expect(sessionsOn(rows, '2026-09-08')).toHaveLength(1);
  });
});
