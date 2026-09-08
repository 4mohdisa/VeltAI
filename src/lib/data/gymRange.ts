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
import { todayISO } from './mappers';
import { lastNDates } from './energyRange';
import type { GymSession } from '@/lib/api';

/** Sessions logged on one calendar day, in the order the API returned them. */
export function sessionsOn(sessions: GymSession[], date: string): GymSession[] {
  return sessions.filter((s) => s.date === date);
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
  refetch: () => void;
};

/** The last `days` days of logged gym sessions. */
export function useGymRange(days: number): GymRange {
  const end = todayISO();
  const dates = useMemo(() => lastNDates(end, days), [end, days]);
  const [sessions, setSessions] = useState<GymSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const from = dates[0];

  useEffect(() => {
    let active = true;
    api.gym
      .listSessions({ from, to: end })
      .then((rows) => {
        if (active) setSessions(rows);
      })
      .catch(() => {
        if (active) setSessions([]);
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

  return { sessions, dates, loading, refetch };
}
