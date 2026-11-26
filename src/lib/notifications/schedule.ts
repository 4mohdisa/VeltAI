// Pure notification scheduling (Row 10a). Given an injected now, an IANA time
// zone, the settings and recent meal logging times, returns what fires between
// now and the end of tomorrow (local). Times are wall clock times in the zone:
// a time skipped by spring forward moves to the first valid minute after the
// gap, and a time repeated by fall back fires once, at its first occurrence.
import type { MealSlot } from '@/lib/mock/data';
import type {
  LocalMinutes,
  MealLogTimes,
  NotificationCategory,
  NotificationSettings,
  QuietHours,
  ScheduledNotification,
} from './types';

const DAY_MIN = 24 * 60;
const MIN_LOGS_FOR_MEDIAN = 3;

const DEFAULT_MEAL_TIMES: Record<MealSlot, LocalMinutes> = {
  Breakfast: 8 * 60,
  Lunch: 12 * 60 + 30,
  Snacks: 15 * 60 + 30,
  Dinner: 18 * 60 + 30,
};
const WORKOUT_TIME: LocalMinutes = 17 * 60;
const STREAK_TIME: LocalMinutes = 20 * 60;
const WEEKLY_SUMMARY = { weekday: 0, time: 18 * 60 }; // Sunday
const PROMOTIONAL = { weekday: 6, time: 11 * 60 }; // Saturday

/** In quiet hours a category either moves to the quiet hours end or is dropped. */
const QUIET_POLICY: Record<NotificationCategory, 'defer' | 'drop'> = {
  meal_reminder: 'drop', // a meal reminder hours late is noise
  workout_reminder: 'defer',
  streak_at_risk: 'drop', // after midnight the streak is already gone
  weekly_summary: 'defer',
  promotional: 'drop',
};

type LocalDate = { y: number; m: number; d: number };

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** The zone's wall clock date and minutes at an instant. */
export function wallClock(instant: number, timeZone: string): LocalDate & { min: LocalMinutes } {
  const p: Record<string, number> = {};
  for (const part of formatter(timeZone).formatToParts(instant)) p[part.type] = Number(part.value);
  return { y: p.year, m: p.month, d: p.day, min: p.hour * 60 + p.minute };
}

const sameDate = (a: LocalDate, b: LocalDate) => a.y === b.y && a.m === b.m && a.d === b.d;

/** The instant of a wall clock time in the zone (see the file comment for DST). */
function zonedInstant(date: LocalDate, min: LocalMinutes, timeZone: string): Date {
  // ponytail: a skipped time steps one minute at a time to the end of the gap (an hour at most).
  for (let m = min; m < min + 2 * 60; m++) {
    const naive = Date.UTC(date.y, date.m - 1, date.d, 0, m);
    const offsets = [naive - 12 * 3_600_000, naive + 12 * 3_600_000].map((t) => {
      const w = wallClock(t, timeZone);
      return Date.UTC(w.y, w.m - 1, w.d, 0, w.min) - t;
    });
    // The larger offset gives the earlier instant, so a repeated time picks its first occurrence.
    for (const offset of [...new Set(offsets)].sort((a, b) => b - a)) {
      const instant = naive - offset;
      const w = wallClock(instant, timeZone);
      if (sameDate(w, date) && w.min === m % DAY_MIN) return new Date(instant);
    }
  }
  throw new Error(`no wall clock time ${min} on ${date.y}-${date.m}-${date.d} in ${timeZone}`);
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/** Median of the slot's real logging times once it has enough, else the default. */
function mealTime(slot: MealSlot, logs: MealLogTimes): LocalMinutes {
  const times = logs[slot] ?? [];
  return times.length >= MIN_LOGS_FOR_MEDIAN ? median(times) : DEFAULT_MEAL_TIMES[slot];
}

const inQuiet = (q: QuietHours, min: LocalMinutes) =>
  q.start <= q.end ? min >= q.start && min < q.end : min >= q.start || min < q.end;

const addDays = (date: LocalDate, days: number): LocalDate => {
  const t = new Date(Date.UTC(date.y, date.m - 1, date.d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
};

type Candidate = Omit<ScheduledNotification, 'fireAt'> & { date: LocalDate; min: LocalMinutes };

function candidatesFor(date: LocalDate, settings: NotificationSettings, logs: MealLogTimes): Candidate[] {
  const weekday = new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay();
  const out: Candidate[] = [];
  const add = (category: NotificationCategory, min: LocalMinutes, slot?: MealSlot) =>
    out.push({ category, date, min, titleKey: `notifications.${category}.title`, ...(slot ? { slot } : {}) });

  if (settings.enabled.meal_reminder) {
    for (const slot of Object.keys(DEFAULT_MEAL_TIMES) as MealSlot[]) add('meal_reminder', mealTime(slot, logs), slot);
  }
  if (settings.enabled.workout_reminder) add('workout_reminder', WORKOUT_TIME);
  if (settings.enabled.streak_at_risk) add('streak_at_risk', STREAK_TIME);
  if (settings.enabled.weekly_summary && weekday === WEEKLY_SUMMARY.weekday) add('weekly_summary', WEEKLY_SUMMARY.time);
  if (settings.promotionalOptIn && weekday === PROMOTIONAL.weekday) add('promotional', PROMOTIONAL.time);
  return out;
}

/** Move a candidate out of quiet hours, or drop it (null) when its category says so. */
function applyQuietHours(c: Candidate, q: QuietHours | null): Candidate | null {
  if (!q || q.start === q.end || !inQuiet(q, c.min)) return c;
  if (QUIET_POLICY[c.category] === 'drop') return null;
  // Past midnight in a wrapping window, the end falls on the next day.
  const nextDay = q.start > q.end && c.min >= q.start;
  return { ...c, date: nextDay ? addDays(c.date, 1) : c.date, min: q.end };
}

export function scheduleNotifications(
  now: Date,
  timeZone: string,
  settings: NotificationSettings,
  logs: MealLogTimes,
): ScheduledNotification[] {
  const today = wallClock(now.getTime(), timeZone);
  // Yesterday too: quiet hours past midnight can move its reminders into today.
  return [addDays(today, -1), today, addDays(today, 1)]
    .flatMap((date) => candidatesFor(date, settings, logs))
    .map((c) => applyQuietHours(c, settings.quietHours))
    .filter((c): c is Candidate => c !== null)
    .map(({ date, min, ...n }) => ({ ...n, fireAt: zonedInstant(date, min, timeZone) }))
    .filter((n) => n.fireAt.getTime() > now.getTime())
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
