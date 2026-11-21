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
  // The goals data holds no burn target, so any target on this row is invented.
  const burnedRow = card.split('<KeyRow').find((row) => row.includes("t('dashboard.energyBalance.burned')"))?.split('/>')[0];
  expect(burnedRow).toBeDefined();
  expect(burnedRow).not.toMatch(/\btarget=/);
  expect(burnedRow).toContain('sub="No burn target set"');
  expect(card).toMatch(/<Ring r=\{RING_INNER_R\} fraction=\{0\}/);
});

test('fibre is the real total, and still "Not tracked" when nothing knows it', () => {
  // Item 6 wired fibre through (Open Food Facts / USDA / typed labels). Summary
  // now passes the computed value rather than a hardcoded null — and that value
  // is null exactly when no logged item carries a figure, which MacroBars still
  // renders as "Not tracked" rather than 0 g.
  const s = code(src(SUMMARY));
  expect(s).toMatch(/macroKey: 'Fibre', consumed: fibreConsumed/);
  expect(s).toContain('useFibreConsumed()');
  expect(code(src('src/components/domain/MacroBars.tsx'))).toContain('Not tracked');
  expect(code(src('src/lib/data/summaryCards.ts'))).toContain('known: withFibre > 0');
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

test('a seeded value is never shown as current while the read is in flight', () => {
  // Summary reads stores the Gym and Food tabs own. Until its own read lands the
  // store still holds the seed (13 days in dev, 0 in release), so the streak and
  // the macro rows must show a loading state rather than that seed.
  const s = code(src(SUMMARY));
  expect(s).toContain('isLoading: dashLoading');
  expect(s).toMatch(/dashLoading \? \(/);
  expect(s).toContain('MACRO_ROWS_H');

  // And the loading state must be backed by a real fetch, not the old cosmetic
  // 600ms timer that fetched nothing.
  const hooks = code(src('src/lib/data/hooks.ts'));
  expect(hooks).toContain('useHydration(hydrateDashboard)');
  expect(hooks).not.toContain('useInitialLoad');
});
