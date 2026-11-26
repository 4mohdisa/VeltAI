// Row 10: localMealTimes turns food log rows into each slot's local meal times,
// and scheduleNotifications uses a slot's median once it has 3 meals. Fixed
// clock: now is passed in, Friday 27 Nov 2026 00:00 UTC.
import { localMealTimes, type MealLog } from './mealTimes';
import { scheduleNotifications } from './schedule';
import { DEFAULT_NOTIFICATION_SETTINGS } from './types';

const NOW = new Date('2026-11-27T00:00:00Z');
const ADELAIDE = 'Australia/Adelaide';

const log = (date: string, meal_type: string, created_at: string): MealLog => ({ date, meal_type, created_at });
const breakfasts = (...hhmm: string[]) =>
  hhmm.map((t, i) => log(`2026-11-2${i}`, 'breakfast', `2026-11-2${i}T${t}:00Z`));

/** The first reminder time (HH:MM in the zone) per meal slot. */
function reminderTimes(logs: MealLog[], timeZone = 'UTC'): Record<string, string> {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' });
  const out: Record<string, string> = {};
  for (const n of scheduleNotifications(NOW, timeZone, DEFAULT_NOTIFICATION_SETTINGS, localMealTimes(logs, timeZone))) {
    if (n.slot && !out[n.slot]) out[n.slot] = fmt.format(n.fireAt);
  }
  return out;
}

test('fewer than 3 meals keep the default time', () => {
  expect(reminderTimes(breakfasts('06:00', '06:00')).Breakfast).toBe('08:00');
});

test('exactly 3 meals use their median', () => {
  expect(reminderTimes(breakfasts('07:10', '07:30', '09:00')).Breakfast).toBe('07:30');
});

test('an even count uses the mean of the middle two', () => {
  expect(reminderTimes(breakfasts('07:10', '07:20', '07:40', '09:00')).Breakfast).toBe('07:30');
});

test('several slots at once, each on its own count', () => {
  const lunches = ['20', '21', '22'].map((d) => log(`2026-11-${d}`, 'lunch', `2026-11-${d}T13:00:00Z`));
  const dinners = ['20', '21'].map((d) => log(`2026-11-${d}`, 'dinner', `2026-11-${d}T20:00:00Z`));
  const times = reminderTimes([...breakfasts('07:00', '07:00', '07:00'), ...lunches, ...dinners]);
  expect(times).toMatchObject({ Breakfast: '07:00', Lunch: '13:00', Dinner: '18:30', Snacks: '15:30' });
});

test('times are local to the zone, not UTC', () => {
  // 21:30 UTC is 08:00 the next morning in Adelaide (UTC+10:30 in summer).
  const logs = ['19', '20', '21'].map((d) => log(`2026-11-${Number(d) + 1}`, 'breakfast', `2026-11-${d}T21:30:00Z`));
  expect(localMealTimes(logs, ADELAIDE)).toEqual({ Breakfast: [480, 480, 480] });
  expect(reminderTimes(logs, ADELAIDE).Breakfast).toBe('08:00');
});

test('the items of one meal count once, timed by the earliest row', () => {
  const meal = ['07:10', '07:00', '07:20'].map((t) => log('2026-11-20', 'breakfast', `2026-11-20T${t}:00Z`));
  expect(localMealTimes(meal, 'UTC')).toEqual({ Breakfast: [420] });
});
