// The weekly energy card follows the app language. Its day letters come from
// calendar.weekdayLetters (Monday first), so each date must land on
// (getDay() + 6) % 7 — a window that starts on a Sunday proves the mapping, not
// just the order. The header, its label, the mode switch, the per-day line and
// the empty and failed states read their own keys.
import { WeekEnergyCard } from '@/components/domain/WeekEnergyCard';
import type { EnergyBalance } from '@/lib/api';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const day = (date: string): EnergyBalance => ({
  date,
  calories_in: 1800,
  calories_out_bmr: 1500,
  calories_out_exercise: 300,
  calories_out_total: 1800,
  net_balance: 0,
  target: 2000,
  variance: -200,
  status: 'on_target',
});
const week = (first: number) => Array.from({ length: 7 }, (_, i) => day(`2026-09-${String(first + i).padStart(2, '0')}`));

const card = (days: EnergyBalance[], error = false) =>
  renderScreen(<WeekEnergyCard days={days} loading={false} error={error} energyUnit="kJ" />);

const letters = (days: EnergyBalance[]) =>
  findAll(card(days), (p) => p.variant === 'caption')
    .map((n) => n.props.children)
    .filter((c): c is string => typeof c === 'string' && /^\p{L}$/u.test(c))
    .join('');

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', 'MTWTFSS', 'SMTWTFS'],
  ['es', 'LMXJVSD', 'DLMXJVS'],
  ['fr', 'LMMJVSD', 'DLMMJVS'],
])('%s', async (lang, mondayFirst, sundayFirst) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  expect(letters(week(7))).toBe(mondayFirst); // Mon 7 – Sun 13 September 2026
  expect(letters(week(6))).toBe(sundayFirst); // Sun 6 – Sat 12 September 2026
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: header, label, mode switch, per-day line and states', async (lang, strings) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const tree = card(week(7));
  const text = allText(tree);
  expect(findAll(tree, (p) => p.title === strings.dashboard.thisWeek).length).toBeGreaterThan(0);
  expect(findAll(tree, (p) => p.accessibilityLabel === strings.dashboard.weekCardLabel).length).toBeGreaterThan(0);
  expect(text).toContain(strings.dashboard.inAndOut);
  expect(text).toContain(strings.dashboard.net);
  expect(text).toContain(strings.dashboard.unitInPerDay.replace('{{unit}}', 'kJ'));
  expect(allText(card([]))).toContain(strings.dashboard.weekCardNoDays);
  expect(allText(card([], true))).toContain(strings.dashboard.weekCardLoadFailed);
});
