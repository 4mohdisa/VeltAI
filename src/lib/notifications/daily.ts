// Row 10 · Reschedules Lume's reminders at most once per local day. Reads the
// permission through device.ts and never prompts. If applySchedule rejects, the
// call rejects without a new day key, so the next call tries again.
import { applySchedule, notificationPermission } from './device';
import { scheduleNotifications } from './schedule';
import type { MealLogTimes, NotificationSettings } from './types';

export type DailyScheduleInput = {
  now: Date;
  timeZone: string;
  settings: NotificationSettings;
  mealLogTimes: MealLogTimes;
  lastDayKey: string | null;
};

/** The local date in the zone as YYYY-MM-DD (en-CA formats dates that way). */
const dayKey = (now: Date, timeZone: string) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);

/** Returns the day key for `now`; schedules only on a new day with permission granted. */
export async function ensureDailySchedule(input: DailyScheduleInput): Promise<string> {
  const { now, timeZone, settings, mealLogTimes, lastDayKey } = input;
  const key = dayKey(now, timeZone);
  if (key === lastDayKey) return key;
  if (await notificationPermission()) {
    await applySchedule(scheduleNotifications(now, timeZone, settings, mealLogTimes));
  }
  return key;
}
