// In-session gym store (Task 1b) — streak and session history, seeded from mock
// in dev only. Logging a session updates the streak and records TODAY'S DATE, so
// the Gym month calendar shows it on its real day before the server row lands.
// No cross-restart persistence (backend).
//
// V7 (DECISIONS.md): this used to hold a 30-slot `calendar` keyed by index,
// with "today" hard-wired to slot 29 and nothing ever filling it from the
// server — a release build's calendar stayed empty forever while the real
// streak sat beside it. Days are now recorded by ISO date and the calendar is
// built from the sessions the server returns (lib/data/gymRange.ts).
import { create } from 'zustand';

import { mockGymSessions, mockStreak, type GymSession } from '@/lib/mock/data';
import { isDevBuild } from '@/lib/env';
import { addDays } from './foodDays';
import { todayISO } from './mappers';

export type Streak = {
  current: number;
  longest: number;
  totalGymDays: number;
  freezesAvailable: number;
  gymLoggedToday: boolean;
  /** The day the active freeze covers (server `last_freeze_date`); null or
   *  absent when there is none. */
  freezeDate?: string | null;
};

/** A session logged on THIS device, by ISO date. `minutes` is null when no
 *  duration was given — never 0, which would read as a zero-minute workout. */
export type LoggedDay = { date: string; minutes: number | null };

let gid = 0;
const sessionId = () => `g_${Date.now().toString(36)}_${(gid++).toString(36)}`;

type GymState = {
  streak: Streak;
  sessions: GymSession[];
  /** Days trained on this device, by date — the calendar's echo of a log whose
   *  server row has not been read back yet. */
  loggedDays: LoggedDay[];
  /** Days a freeze was applied to from this device, by date. */
  frozenDates: string[];

  /** Log today's gym session: records today's date, extends the streak, prepends
   *  history. `energy` (1–5) is device-local only — the backend session row has
   *  no field for it. */
  logGymSession: (session?: Partial<Omit<GymSession, 'id' | 'date'>> & { energy?: number }) => void;
  /** Spend a freeze token to protect the day `offsetDays` from today (0 = today). */
  applyFreeze: (offsetDays?: number) => void;

  /** Sign-out: back to the seeded initial state (no user data retained). */
  reset: () => void;
};

// A RELEASE build starts EMPTY. Seeding a 13-day streak, 47 total gym days and
// past sessions meant a real user saw achievements they never earned presented
// as their own — App Store 2.1, and the same fabricated-data failure that has
// bitten this codebase twice before. Dev keeps the streak and history seed so the
// keyless offline experience stays navigable; the calendar has no seed in either
// build, because it is drawn from real sessions only.
function seedGym(): Pick<GymState, 'streak' | 'sessions' | 'loggedDays' | 'frozenDates'> {
  if (!isDevBuild()) {
    return {
      streak: { current: 0, longest: 0, totalGymDays: 0, freezesAvailable: 0, gymLoggedToday: false },
      sessions: [],
      loggedDays: [],
      frozenDates: [],
    };
  }
  return {
    streak: { ...mockStreak },
    sessions: mockGymSessions.map((x) => ({ ...x })),
    loggedDays: [],
    frozenDates: [],
  };
}

export const useGymStore = create<GymState>((set) => ({
  ...seedGym(),
  reset: () => set({ ...seedGym() }),

  logGymSession: (session) =>
    set((s) => {
      if (s.streak.gymLoggedToday) return s;
      const current = s.streak.current + 1;
      const today = todayISO();
      return {
        streak: {
          ...s.streak,
          gymLoggedToday: true,
          current,
          longest: Math.max(s.streak.longest, current),
          totalGymDays: s.streak.totalGymDays + 1,
        },
        loggedDays: [...s.loggedDays.filter((d) => d.date !== today), { date: today, minutes: session?.durationMin ?? null }],
        sessions: [
          { id: sessionId(), date: 'Today', durationMin: 60, effort: 7, ...session },
          ...s.sessions.filter((x) => x.date !== 'Today'),
        ],
      };
    }),

  applyFreeze: (offsetDays = 0) =>
    set((s) =>
      s.streak.freezesAvailable <= 0
        ? s
        : {
            streak: { ...s.streak, freezesAvailable: s.streak.freezesAvailable - 1 },
            // By date, not by grid slot. The calendar only draws a freeze on a day
            // that has arrived, so one for an upcoming day waits for its day.
            frozenDates: [...new Set([...s.frozenDates, addDays(todayISO(), offsetDays)])],
          },
    ),
}));
