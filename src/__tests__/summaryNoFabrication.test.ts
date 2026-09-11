// V16 — Summary's design cards carry no invented number. The design shows several
// values the app has no data for (steps, a 2,400 kcal burn target, "of 5
// sessions", gym calories, fibre eaten); each is pinned here as NOT built, so a
// later pass cannot quietly fill one in. Also pins the one-tap gym log that the
// design would remove (a logged conflict) and the design's card order.
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..', '..');
const src = (p: string) => readFileSync(join(root, p), 'utf8');
// Comments may talk about the design's numbers; only code is checked.
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const SUMMARY = 'src/app/(tabs)/index.tsx';
const FILES = [
  SUMMARY,
  'src/components/domain/EnergyBalanceCard.tsx',
  'src/components/domain/WeekEnergyCard.tsx',
  'src/components/domain/WorkoutsWeekCard.tsx',
  'src/lib/data/summaryCards.ts',
];

test.each(FILES)('%s prints no literal number beside a unit', (file) => {
  const offenders = code(src(file)).match(/[^\w.]\d[\d,]*\s?(kcal|kJ|steps|min|sessions|g)\b/gi) ?? [];
  expect(offenders).toEqual([]);
});

test('no steps: there is no step data, so there is no Steps card', () => {
  expect(code(src(SUMMARY))).not.toMatch(/title="Steps"/);
});

test('no weekly target: Workouts never says "of N sessions"', () => {
  for (const f of FILES) expect(code(src(f))).not.toMatch(/of \d+ sessions/);
});

test('no burn target: the Burned key has no target and says so', () => {
  const card = code(src('src/components/domain/EnergyBalanceCard.tsx'));
  expect(card).not.toMatch(/label="Burned"[\s\S]{0,160}target=/);
  expect(card).toContain('No burn target set');
});

test('fibre is not recorded, so Summary shows it as not tracked — never a zero', () => {
  expect(code(src(SUMMARY))).toMatch(/macroKey: 'Fibre', consumed: null/);
  expect(code(src('src/components/domain/MacroBars.tsx'))).toContain('Not tracked');
});

test('the one-tap gym log is still on Summary (the logged V16 conflict)', () => {
  const s = code(src(SUMMARY));
  expect(s).toContain('<GymStatusCard');
  expect(s).toMatch(/logGymSession\(\)/);
});

test("the design's order: Energy balance → This week → Workouts → Macros, then the rest", () => {
  const s = code(src(SUMMARY));
  const at = (tag: string) => s.indexOf(tag);
  const order = ['<EnergyBalanceCard', '<WeekEnergyCard', '<WorkoutsWeekCard', '<MacroTargetRows', '<GymStatusCard'].map(at);
  expect(order.every((i) => i > 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
});
