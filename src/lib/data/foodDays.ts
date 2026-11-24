// Which days have food logged — the dots under the week strip and on the month
// calendar (architecture items 3 and 5).
//
// GET /api/food/days returns exactly this set — the distinct dates the
// authenticated user has at least one food row on, deduped and sorted by the
// database. It replaced the previous approach, which called GET /api/food/logs
// with no date and pulled the user's ENTIRE unpaginated log history, with every
// macro and scan_results blob on every row, only to read the `date` off each one.
//
// Every dot still stands for a real row; a day with no logs simply has no dot.
// A failed call reports `error` and keeps whatever dots it already had, so the
// caller can say "couldn't load" instead of passing an outage off as an empty
// log (the same contract as useHydration's callers in ./hooks).
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { Async } from './hooks';

/** `data` and `isLoading` follow Async like useGoals; `days` and `loading` are
 *  the same values under the names the Food tab and calendar already read. */
export type LoggedDays = Async<ReadonlySet<string>> & {
  /** ISO YYYY-MM-DD strings that have at least one food row. */
  days: ReadonlySet<string>;
  loading: boolean;
};

const EMPTY: ReadonlySet<string> = new Set<string>();

export function useLoggedDays(): LoggedDays {
  const [days, setDays] = useState<ReadonlySet<string>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    api.foodLogs
      .days()
      .then((dates) => {
        if (!active) return;
        // `?? []` keeps a null body a dotless calendar rather than a crash.
        setDays(new Set(dates ?? []));
        setError(null); // a later success clears an earlier failure
      })
      .catch((e: unknown) => {
        // No backend, or the call failed. Report it and leave the dots alone:
        // an empty set here would claim "nothing logged", which we do not know.
        if (active) setError(e instanceof Error ? e : new Error('logged days failed'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [nonce]);

  const refetch = useCallback(() => {
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);

  return { data: days, days, isLoading: loading, loading, error, refetch };
}

// --- pure date helpers, exported so the node suite can test them directly -----

/** ISO YYYY-MM-DD for a Date, in the DEVICE's calendar (never UTC — a log made
 *  at 9pm local must not be filed under tomorrow). */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parse an ISO day into a LOCAL midnight Date. `new Date('2026-01-15')` parses
 *  as UTC and lands on the previous day west of Greenwich. */
export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** `iso` shifted by whole days, as ISO. */
export function addDays(iso: string, delta: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + delta);
  return isoDate(d);
}

/** The seven ISO dates of the week containing `iso`, Monday first. */
export function weekOf(iso: string): string[] {
  const d = fromIso(iso);
  // getDay(): 0 = Sunday. Shift so Monday starts the week, as the design draws it.
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = addDays(iso, -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Every cell of the month grid containing `iso`: the month's days padded with
 *  nulls so the first lands under its weekday column (Monday first). */
export function monthGrid(iso: string): (string | null)[] {
  const d = fromIso(iso);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(isoDate(new Date(d.getFullYear(), d.getMonth(), day)));
  }
  return cells;
}

/** `iso` moved by whole months, clamped to the target month's length. */
export function addMonths(iso: string, delta: number): string {
  const d = fromIso(iso);
  const target = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return isoDate(new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), lastDay)));
}
