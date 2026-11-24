// The weekly energy card's day letters come from calendar.weekdayLetters (Monday
// first), so each date must land on (getDay() + 6) % 7 — a window that starts on
// a Sunday proves the mapping, not just the order.
import { WeekEnergyCard } from '@/components/domain/WeekEnergyCard';
import type { EnergyBalance } from '@/lib/api';
import i18n from '@/lib/i18n';
import { act, findAll, renderScreen } from './helpers';

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

const letters = (days: EnergyBalance[]) =>
  findAll(renderScreen(<WeekEnergyCard days={days} loading={false} error={false} energyUnit="kcal" />), (p) => p.variant === 'caption')
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
