// Which days have food logged — the dots under the week strip and on the month
// calendar (architecture items 3 and 5).
//
// GET /api/food/logs takes ONE exact date and has no range parameter
// (backend/internal/food/handlers.go:123), but omitting `date` returns every row
// the user has. So the set of logged days is derived from one unfiltered call and
// grouped client-side. Every dot therefore stands for a real row; a day with no
// logs simply has no dot, and a failed call draws no dots at all rather than
// guessing.
//
// ponytail: one unpaginated fetch of the whole history, cached per mount and
// re-fetched after a write. Fine at a year of logging; if it ever isn't, the fix
// is a `/api/food/days` endpoint returning just the dates — a backend change,
// which is why it is not done here.
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';

export type LoggedDays = {
  /** ISO YYYY-MM-DD strings that have at least one food row. */
  days: ReadonlySet<string>;
  loading: boolean;
  refetch: () => void;
};

const EMPTY: ReadonlySet<string> = new Set<string>();

export function useLoggedDays(): LoggedDays {
  const [days, setDays] = useState<ReadonlySet<string>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    api.foodLogs
      .list()
      .then((rows) => {
        if (!active) return;
        const set = new Set<string>();
        for (const r of rows) if (r.date) set.add(r.date);
        setDays(set);
      })
      .catch(() => {
        // No backend, or the call failed. Draw NO dots — a dot is a claim that a
        // day has a log, and we cannot make that claim from a failed request.
        if (active) setDays(EMPTY);
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

  return { days, loading, refetch };
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
