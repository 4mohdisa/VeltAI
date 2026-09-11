// V16 — Summary's lead card in every state. It never prints a number the data
// does not hold: no burn target exists, so there is never a "/ target" beside
// Burned; no goal means no "% of goal"; no body stats means no net.
// Skeleton animates through reanimated's useReducedMotion, which this render
// environment does not provide; the loading state is checked by what it does
// NOT show, so a plain stand-in is enough. (jest.mock is hoisted above the imports.)
import { EnergyBalanceCard } from '@/components/domain/EnergyBalanceCard';
import type { EnergyBalance } from '@/lib/api';
import { allText, renderScreen } from './helpers';

jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));

const day = (over: Partial<EnergyBalance> = {}): EnergyBalance => ({
  date: '2026-09-10',
  calories_in: 1240,
  calories_out_bmr: 1660,
  calories_out_exercise: 204,
  calories_out_total: 1864,
  net_balance: -624,
  target: 2100,
  variance: -860,
  status: 'deficit',
  ...over,
});
const text = (props: Partial<Parameters<typeof EnergyBalanceCard>[0]>) =>
  allText(renderScreen(<EnergyBalanceCard day={day()} loading={false} error={false} energyUnit="kcal" {...props} />));

test('a full day: the net, intake against the goal, and burned with no invented target', () => {
  const t = text({});
  expect(t).toContain('−624');
  expect(t).toContain('deficit');
  expect(t).toContain('1,240');
  expect(t).toContain('2,100');
  expect(t).toContain('59% of goal');
  expect(t).toContain('1,864');
  expect(t).toContain('No burn target set');
  expect(t).not.toContain('of target');
});

test('no calorie goal: no goal number and no percentage, and it says so', () => {
  const t = text({ day: day({ target: null, variance: null, status: 'no_target' }) });
  expect(t).toContain('No calorie goal set');
  expect(t).not.toContain('% of goal');
});

test('no body stats: no net number, the reason instead, and burned is a dash', () => {
  const t = text({ day: day({ calories_out_bmr: null, calories_out_total: null, net_balance: null, variance: null }) });
  expect(t).toContain('Add your body stats');
  expect(t).not.toContain('deficit');
  expect(t).toContain('—');
});

test('nothing logged or burned yet: an empty state, not a card of blanks', () => {
  const t = text({ day: day({ calories_in: 0, calories_out_bmr: null, calories_out_total: null, net_balance: null }) });
  expect(t).toContain('Nothing logged or burned yet today');
});

test('a failed read says it failed', () => {
  expect(text({ day: null, error: true })).toContain("Couldn't load today's energy balance");
});

test('loading shows no numbers at all', () => {
  const t = text({ day: null, loading: true });
  expect(t).not.toContain('deficit');
  expect(t).not.toContain('No burn target set');
});
