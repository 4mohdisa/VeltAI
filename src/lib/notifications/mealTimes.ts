// Row 10 · The user's real meal times for the meal reminders. Pure: food log
// rows in, each slot's local logging times out, for scheduleNotifications, which
// uses a slot's median once it has 3 meals and the default time before that. A
// slot and day is one meal (its items are separate rows), timed by its earliest
// row. Midnight wrap-around (a late snack at 23:50 and one at 00:10) is not
// handled yet.
import type { FoodLog } from '@/lib/api';
import { slotOf } from '@/lib/data/mappers';
import type { MealSlot } from '@/lib/mock/data';
import { wallClock } from './schedule';
import type { MealLogTimes } from './types';

export type MealLog = Pick<FoodLog, 'date' | 'meal_type' | 'created_at'>;

export function localMealTimes(logs: MealLog[], timeZone: string): MealLogTimes {
  const firstLog = new Map<string, { slot: MealSlot; at: number }>();
  for (const log of logs) {
    const slot = slotOf(log.meal_type);
    const key = `${log.date}|${slot}`;
    const at = Date.parse(log.created_at);
    if (at < (firstLog.get(key)?.at ?? Infinity)) firstLog.set(key, { slot, at });
  }
  const out: MealLogTimes = {};
  for (const { slot, at } of firstLog.values()) (out[slot] ??= []).push(wallClock(at, timeZone).min);
  return out;
}
