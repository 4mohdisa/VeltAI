// Energy over a window longer than one week, plus the small date helpers the
// four Summary detail screens share.
//
// GET /api/energy-balance/week takes an END DATE, so two calls seven days apart
// return fourteen REAL server-computed days. Nothing here interpolates, back-
// fills or estimates: a day the server could not compute keeps its nulls, and
// every caller is expected to draw that as a GAP rather than a zero (a zero bar
// would claim the user ate or burned nothing that day).
//
// Failure posture copied from useEnergyWeek (./energy.ts): loading starts true
// and only clears in .finally, any failure yields no data, nothing throws.
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { todayISO } from './mappers';
import type { EnergyBalance } from '@/lib/types';

/** One calendar day in ms — clock arithmetic, not an animation duration. */
const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Shift a YYYY-MM-DD by whole days. Read as UTC so no timezone can slide the
 *  calendar day the server keyed the row by. Returns the input unchanged if it
 *  is not a date, so a malformed row can never produce "NaN-NaN-NaN". */
export function shiftISO(date: string, days: number): string {
  const t = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(t)) return date;
  return new Date(t + days * DAY_MS).toISOString().slice(0, 10);
}

/** The `n` calendar days ending on `end`, oldest first. */
export function lastNDates(end: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => shiftISO(end, i - (n - 1)));
}

/** Merge overlapping windows into one series, oldest first, one entry per date.
 *  Later arguments win a collision — they are the fresher read of the same day. */
export function mergeDays(...windows: (EnergyBalance[] | undefined)[]): EnergyBalance[] {
  const byDate = new Map<string, EnergyBalance>();
  for (const w of windows) for (const d of w ?? []) byDate.set(d.date, d);
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Total burn for a day, or null when the server could not compute one.
 *  NEVER falls back to 0 or to calories_out_exercise alone: both would draw a
 *  burn figure the backend explicitly declined to state. */
export function burnOf(d: EnergyBalance): number | null {
  return d.calories_out_total;
}

/** Net (intake − burn) for a day, or null. Same rule as burnOf: a day without a
 *  net is a gap in the chart and an em dash in the list, not a zero. */
export function netOf(d: EnergyBalance): number | null {
  return d.net_balance;
}

/** "Mon" for a YYYY-MM-DD. Parsed at local midnight, matching todayISO(). */
export function weekdayShort(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const i = d.getDay();
  return Number.isNaN(i) ? date : WEEKDAY_SHORT[i];
}

/** "9 Aug" for a YYYY-MM-DD — the 14-day axis label. */
export function dayMonth(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? date : `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/** Mean of the values, or null when there are none — never 0, which would read
 *  as "you averaged nothing" instead of "there is nothing to average". */
export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export type EnergyRange = {
  /** Up to 14 server days, oldest first. Short when the user is newer than that. */
  days: EnergyBalance[];
  loading: boolean;
  refetch: () => void;
};

/** 14 real days of energy balance: the current week plus the one before it. */
export function useEnergyRange(): EnergyRange {
  // Device-local calendar, same anchor useEnergyWeek uses — food writes are
  // stamped with todayISO(), so the window has to ask for the same day.
  const end = todayISO();
  const [days, setDays] = useState<EnergyBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    // allSettled: one window failing still shows the other's real days.
    Promise.allSettled([api.energy.getWeek(end), api.energy.getWeek(shiftISO(end, -7))])
      .then(([recent, earlier]) => {
        if (!active) return;
        const recentDays = recent.status === 'fulfilled' ? recent.value.days : undefined;
        const olderDays = earlier.status === 'fulfilled' ? earlier.value.days : undefined;
        setDays(mergeDays(olderDays, recentDays));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [end, nonce]);

  const refetch = useCallback(() => {
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);

  return { days, loading, refetch };
}
