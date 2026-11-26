// Row 10 · Reschedules Lume's reminders at most once per local day. Reads the
// permission through device.ts and never prompts. If applySchedule rejects, the
// call rejects without a new day key, so the next call tries again.
// startDailySchedule is the one call the root layout makes: now and on every foreground.
import { AppState } from 'react-native';

import { deviceTimeZone } from '@/lib/api';
import { fetchWeekLogs } from '@/lib/data/hooks';
import { hydrateNotificationSettings, useSettingsStore } from '@/lib/settings/store';
import { deleteItem, getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { applySchedule, notificationPermission } from './device';
import { localMealTimes } from './mealTimes';
import { restorePushToken } from './pushToken';
import { scheduleNotifications } from './schedule';
import type { MealLogTimes, NotificationSettings } from './types';

export type DailyScheduleInput = {
  now: Date;
  timeZone: string;
  settings: NotificationSettings;
  mealLogTimes: MealLogTimes;
  lastDayKey: string | null;
};

/** The zone reminders are planned in: the device's, or UTC when it can't be read. */
const notificationTimeZone = (): string => deviceTimeZone() ?? 'UTC';

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

let running: Promise<void> | null = null;

/** Loads the saved settings and day key, then runs ensureDailySchedule. The day
 *  key is saved only after a successful run, so a failed schedule retries on the
 *  next call. Also re-registers the push token. Overlapping calls share one run. Never throws. */
export function runDailySchedule(): Promise<void> {
  running ??= (async () => {
    // Not awaited: re-registering the push token never holds up the schedule.
    void restorePushToken();
    await hydrateNotificationSettings();
    const timeZone = notificationTimeZone();
    // A failed read (offline, signed out) falls back to the default meal times.
    const logs = await fetchWeekLogs().then((days) => days.flat(), () => []);
    const key = await ensureDailySchedule({
      now: new Date(),
      timeZone,
      settings: useSettingsStore.getState().notifications,
      mealLogTimes: localMealTimes(logs, timeZone),
      lastDayKey: await getItem(STORAGE_KEYS.notificationDayKey),
    });
    await setItem(STORAGE_KEYS.notificationDayKey, key);
  })()
    .catch(() => undefined)
    .finally(() => {
      running = null;
    });
  return running;
}

/** Reschedules today even if today already ran, e.g. after a settings change.
 *  ponytail: joins a run already in flight, which may predate the change; the next foreground catches up. */
export async function rescheduleToday(): Promise<void> {
  await deleteItem(STORAGE_KEYS.notificationDayKey);
  await runDailySchedule();
}

/** Runs runDailySchedule now and each time the app becomes active. Returns the unsubscribe. */
export function startDailySchedule(): () => void {
  void runDailySchedule();
  const sub = AppState.addEventListener('change', (next) => {
    if (next === 'active') void runDailySchedule();
  });
  return () => sub.remove();
}
