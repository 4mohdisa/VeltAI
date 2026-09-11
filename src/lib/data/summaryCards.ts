// Pure pieces behind the Summary tab's design cards (V16). Every number the
// cards draw comes through here from a server response or the user's own
// goals — nothing is estimated, and a value the server could not compute stays
// null so the card can say so instead of printing a zero.
import type { EnergyBalance, GymSession } from '@/lib/api';
import { burnOf, mean, netOf } from './energyRange';
import { fromIso, weekOf } from './foodDays';
import { sessionsOn } from './gymRange';

/** Today's row out of the 7-day window, or null when the window lacks it. */
export function todayRow(days: EnergyBalance[] | undefined, today: string): EnergyBalance | null {
  return days?.find((d) => d.date === today) ?? null;
}

/** A round axis ceiling above every value: the next multiple of `step`, never below it. */
export function axisMax(values: (number | null | undefined)[], step: number): number {
  const top = Math.max(0, ...values.map((v) => (v == null ? 0 : Math.abs(v))));
  return Math.max(step, Math.ceil(top / step) * step);
}

/** The week's headline: average intake per day, or average net over the days the
 *  server could compute one (null when it computed none). */
export function weekStat(days: EnergyBalance[], mode: 'inout' | 'net'): number | null {
  if (days.length === 0) return null;
  if (mode === 'inout') return mean(days.map((d) => d.calories_in));
  const nets = days.map(netOf).filter((n): n is number => n != null);
  return nets.length > 0 ? mean(nets) : null;
}

/** "Thu 10 · in 1,240 · burned 1,864 · net −624" — a missing burn or net is a
 *  dash, never a zero. The caller appends the unit. */
export function dayReadout(d: EnergyBalance, fmt: (n: number) => string): string {
  const date = fromIso(d.date);
  const day = `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${date.getDate()}`;
  const burned = burnOf(d);
  const net = netOf(d);
  const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : fmt(0));
  return `${day} · in ${fmt(d.calories_in)} · burned ${burned == null ? '—' : fmt(burned)} · net ${net == null ? '—' : signed(net)}`;
}

export type WorkoutPip = { letter: string; date: string; trained: boolean };
export type WorkoutsWeek = { sessions: number; minutes: number; untimed: number; pips: WorkoutPip[] };

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** This calendar week (Monday first) from logged sessions: how many, the minutes
 *  that were recorded, how many had no duration, and a pip per day. */
export function workoutsWeek(sessions: GymSession[], today: string): WorkoutsWeek {
  let count = 0;
  let minutes = 0;
  let untimed = 0;
  const pips = weekOf(today).map((date, i) => {
    const onDay = date > today ? [] : sessionsOn(sessions, date);
    count += onDay.length;
    for (const s of onDay) {
      if (s.duration_minutes == null) untimed += 1;
      else minutes += s.duration_minutes;
    }
    return { letter: LETTERS[i], date, trained: onDay.length > 0 };
  });
  return { sessions: count, minutes, untimed, pips };
}

/** The line under the session count. No per-session calories exist, so where the
 *  design says "2,000 kcal burned in the gym" this says the time that was logged. */
export function workoutsLine(w: WorkoutsWeek): string {
  if (w.sessions === 0) return 'No sessions yet this week';
  const parts: string[] = [];
  if (w.minutes > 0) parts.push(`${Math.floor(w.minutes / 60)}h ${w.minutes % 60}m trained`);
  if (w.untimed > 0) parts.push(`${w.untimed} without a duration`);
  return parts.join(' · ') || 'Duration not recorded';
}

/** Share of a target for a ring; 0 with no target, so an unknown goal draws an empty ring. */
export function ringFraction(value: number, target: number | null | undefined): number {
  if (target == null || target <= 0) return 0;
  return Math.max(0, Math.min(1, value / target));
}
