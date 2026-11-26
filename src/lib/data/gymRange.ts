// Gym sessions across an explicit date range, for the Training detail view.
// GET /api/gym/sessions already accepts { from, to } — nothing is added to the
// API surface here, and nothing is estimated: per-session calories do not exist
// on GymSession, so this module only ever reports what was logged (dates, names,
// durations).
//
// Failure posture matches ./energy.ts: loading starts true, clears in .finally,
// a failure yields an empty list and never throws.
import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import i18n from '@/lib/i18n';
import { dateLocale, formatHoursMinutes } from '@/lib/formatting';
import { todayISO } from './mappers';
import { lastNDates } from './energyRange';
import { fromIso, monthGrid } from './foodDays';
import type { GymSession } from '@/lib/api';

/** Sessions logged on one calendar day, in the order the API returned them. */
export function sessionsOn(sessions: GymSession[], date: string): GymSession[] {
  return sessions.filter((s) => s.date === date);
}

/** What one exercise was last logged as: the API stores one row per exercise,
 *  so this is the set count and the top set's reps and weight. */
export type LastSets = { sets: number; reps?: number; weight?: number };

/**
 * The sets `name` was logged with in the newest session other than `currentId`
 * (newest by date, then by id). Null when no such session has the exercise, or
 * when that newest one logged it without a set count, so the caller keeps the plan.
 */
export function lastSetsFor(name: string, sessions: GymSession[], currentId: string | null): LastSets | null {
  const key = name.trim().toLowerCase();
  const match = (s: GymSession) => s.exercises?.find((e) => e.name.trim().toLowerCase() === key);
  const newest = sessions
    .filter((s) => s.id !== currentId && match(s))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0];
  const ex = newest && match(newest);
  if (!ex?.sets) return null;
  // A value the session did not record is left out, so spreading this over the
  // plan keeps the planned value.
  return {
    sets: ex.sets,
    ...(ex.reps != null ? { reps: ex.reps } : {}),
    ...(ex.weight != null ? { weight: ex.weight } : {}),
  };
}

/**
 * Minutes trained on each of `dates`.
 *   - no session that day  → 0   (a real rest day: the range read covers it)
 *   - sessions but no duration on any of them → null (unknown, so a GAP)
 *   - otherwise the sum of the durations that were actually recorded
 * The null case matters: a session logged without a duration is not a zero-minute
 * session, and drawing it as one would understate the user's own training.
 */
export function minutesByDate(sessions: GymSession[], dates: string[]): (number | null)[] {
  return dates.map((date) => {
    const onDay = sessionsOn(sessions, date);
    if (onDay.length === 0) return 0;
    const timed = onDay.filter((s) => s.duration_minutes != null);
    if (timed.length === 0) return null;
    return timed.reduce((a, s) => a + (s.duration_minutes ?? 0), 0);
  });
}

export type GymRange = {
  sessions: GymSession[];
  /** The `days` calendar days ending today, oldest first. */
  dates: string[];
  loading: boolean;
  /** The read failed. A caller must say so, never show "no sessions" (V16). */
  error: boolean;
  refetch: () => void;
};

/** The last `days` days of logged gym sessions. */
export function useGymRange(days: number): GymRange {
  const end = todayISO();
  const dates = useMemo(() => lastNDates(end, days), [end, days]);
  const [sessions, setSessions] = useState<GymSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);
  const from = dates[0];

  useEffect(() => {
    let active = true;
    api.gym
      .listSessions({ from, to: end })
      .then((rows) => {
        if (!active) return;
        setSessions(rows);
        setError(false);
      })
      .catch(() => {
        if (!active) return;
        setSessions([]);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [from, end, nonce]);

  const refetch = useCallback(() => {
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);

  return { sessions, dates, loading, error, refetch };
}

// --- V7: the Gym month calendar ---------------------------------------------
//
// The calendar used to be a 30-slot array keyed by index that nothing ever
// filled from the server, so a release build showed an empty grid and a
// "13-day streak · 0 sessions" line. Everything below is built from sessions
// the server returned for the month on screen, plus the local echo of one just
// logged here, and nothing else.

/** The design's four-step ramp, by minutes trained on a day:
 *    0  no session
 *    1  a session with no recorded duration, or up to 30 min
 *    2  31–55 min
 *    3  over 55 min — 55 is the design's own line between its two logged levels
 *  A session without a duration is the lowest non-zero band: it happened, so it
 *  is never drawn as a rest day, but its length is unknown. */
export type Intensity = 0 | 1 | 2 | 3;
export function intensityOf(sessions: number, minutes: number | null): Intensity {
  if (sessions === 0) return 0;
  if (minutes == null || minutes <= 30) return 1;
  return minutes <= 55 ? 2 : 3;
}

export type MonthDay = {
  date: string;
  day: number;
  level: Intensity;
  sessions: number;
  /** Recorded minutes that day; null when no session carried a duration. */
  minutes: number | null;
  /** A freeze covered this day and nothing was trained on it. */
  frozen: boolean;
  future: boolean;
  today: boolean;
};

export type MonthView = {
  /** Monday-first grid: leading nulls, then one cell per day of the month. */
  cells: (MonthDay | null)[];
  sessions: number;
  minutes: number;
  /** Sessions logged without a duration — counted, but not in `minutes`. */
  untimed: number;
  freezes: number;
};

/**
 * One month of the calendar, from what was actually logged.
 * - `server` — sessions the API returned (any range; days outside the month are ignored)
 * - `local`  — days logged on this device; used only where the server has no row
 *   for that date yet, so the same session is never counted twice
 * - `frozen` — freeze days (the streak's active freeze plus any applied here)
 * Days after `today` are never shaded or counted: nothing has happened on them.
 */
export function monthView(
  month: string,
  today: string,
  server: GymSession[],
  local: { date: string; minutes: number | null }[],
  frozen: string[],
): MonthView {
  const frozenSet = new Set(frozen.filter(Boolean));
  let sessions = 0;
  let minutes = 0;
  let untimed = 0;
  let freezes = 0;
  const cells = monthGrid(month).map((date): MonthDay | null => {
    if (date == null) return null;
    const future = date > today;
    let count = 0;
    let dayMinutes: number | null = null;
    let dayUntimed = 0;
    if (!future) {
      const onDay = sessionsOn(server, date);
      if (onDay.length > 0) {
        const timed = onDay.filter((s) => s.duration_minutes != null);
        count = onDay.length;
        dayUntimed = count - timed.length;
        dayMinutes = timed.length > 0 ? timed.reduce((a, s) => a + (s.duration_minutes ?? 0), 0) : null;
      } else {
        const mine = local.find((d) => d.date === date);
        if (mine) {
          count = 1;
          dayMinutes = mine.minutes;
          dayUntimed = mine.minutes == null ? 1 : 0;
        }
      }
    }
    const isFrozen = !future && count === 0 && frozenSet.has(date);
    sessions += count;
    minutes += dayMinutes ?? 0;
    untimed += dayUntimed;
    if (isFrozen) freezes += 1;
    return {
      date,
      day: fromIso(date).getDate(),
      level: intensityOf(count, dayMinutes),
      sessions: count,
      minutes: dayMinutes,
      frozen: isFrozen,
      future,
      today: date === today,
    };
  });
  return { cells, sessions, minutes, untimed, freezes };
}

/** The line under the grid: the design's "6 sessions · 5h 10m", plus an honest
 *  note of sessions without a duration and of freeze days when there are any. */
export function monthSummary(v: MonthView): string {
  const parts = [i18n.t('gym.monthSessions', { count: v.sessions })];
  if (v.minutes > 0) parts.push(formatHoursMinutes(v.minutes));
  if (v.untimed > 0) parts.push(i18n.t('gym.monthUntimed', { count: v.untimed }));
  if (v.freezes > 0) parts.push(i18n.t('gym.monthFreezes', { count: v.freezes }));
  return parts.join(' · ');
}

/** "September", or "December 2025" for a month outside the current year — as the design names it,
 *  in the app's current language. */
export function monthTitle(month: string, today: string): string {
  const d = fromIso(month);
  const name = d.toLocaleDateString(dateLocale(i18n.language), { month: 'long' });
  return d.getFullYear() === fromIso(today).getFullYear() ? name : `${name} ${d.getFullYear()}`;
}

export type GymMonth = {
  sessions: GymSession[];
  loading: boolean;
  /** The read failed. The screen must say so rather than report "0 sessions". */
  error: boolean;
  refetch: () => void;
};

/** Every session logged in the month containing `month` (any ISO day in it), up to today. */
export function useGymMonth(month: string): GymMonth {
  const today = todayISO();
  const days = monthGrid(month).filter((d): d is string => d != null);
  const from = days[0];
  const last = days[days.length - 1];
  const to = last < today ? last : today;
  const [nonce, setNonce] = useState(0);
  const key = `${from}|${to}|${nonce}`;
  // The result carries the key it answers, so a month's loading state is
  // derived rather than set inside the effect, and a late answer for the month
  // the user already paged away from can never paint over the current one.
  const [result, setResult] = useState<{ key: string; sessions: GymSession[]; error: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    api.gym
      .listSessions({ from, to })
      .then((rows) => {
        if (active) setResult({ key, sessions: rows, error: false });
      })
      .catch(() => {
        if (active) setResult({ key, sessions: [], error: true });
      });
    return () => {
      active = false;
    };
  }, [key, from, to]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  const current = result?.key === key ? result : null;
  return { sessions: current?.sessions ?? [], loading: current == null, error: current?.error ?? false, refetch };
}
