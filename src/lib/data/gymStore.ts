// In-session gym store (Task 1b) — streak, 30-day calendar, and session history,
// seeded from mock. Logging a session updates the streak + marks today + prepends
// a session so the change is consistent across the Gym and Dashboard tabs within a
// session. No cross-restart persistence (backend).
import { create } from 'zustand';

import { mockGymCalendar, mockGymSessions, mockStreak, type DayStatus, type GymSession } from '@/lib/mock/data';
import { isDevBuild } from '@/lib/env';

export type Streak = {
  current: number;
  longest: number;
  totalGymDays: number;
  freezesAvailable: number;
  gymLoggedToday: boolean;
};

let gid = 0;
const sessionId = () => `g_${Date.now().toString(36)}_${(gid++).toString(36)}`;

type GymState = {
  streak: Streak;
  calendar: { index: number; status: DayStatus }[];
  sessions: GymSession[];

  /** Log today's gym session: marks today, extends the streak, prepends history.
   *  `energy` (1–5) is device-local only — the backend session row has no field for it. */
  logGymSession: (session?: Partial<Omit<GymSession, 'id' | 'date'>> & { energy?: number }) => void;
  /** Spend a freeze token to protect the streak `offsetDays` from today (0 = today). */
  applyFreeze: (offsetDays?: number) => void;

  /** Sign-out: back to the seeded initial state (no user data retained). */
  reset: () => void;
};

// A RELEASE build starts EMPTY. Seeding a 13-day streak, 47 total gym days and
// past sessions meant a real user saw achievements they never earned presented
// as their own — App Store 2.1, and the same fabricated-data failure that has
// bitten this codebase twice before. Dev keeps the seed so the keyless offline
// experience stays navigable.
function seedGym(): Pick<GymState, 'streak' | 'calendar' | 'sessions'> {
  if (!isDevBuild()) {
    return {
      streak: { current: 0, longest: 0, totalGymDays: 0, freezesAvailable: 0, gymLoggedToday: false },
      calendar: [],
      sessions: [],
    };
  }
  return {
    streak: { ...mockStreak },
    calendar: mockGymCalendar.map((d) => ({ ...d })),
    sessions: mockGymSessions.map((x) => ({ ...x })),
  };
}

export const useGymStore = create<GymState>((set) => ({
  ...seedGym(),
  reset: () => set({ ...seedGym() }),

  logGymSession: (session) =>
    set((s) => {
      if (s.streak.gymLoggedToday) return s;
      const current = s.streak.current + 1;
      return {
        streak: {
          ...s.streak,
          gymLoggedToday: true,
          current,
          longest: Math.max(s.streak.longest, current),
          totalGymDays: s.streak.totalGymDays + 1,
        },
        calendar: s.calendar.map((d) => (d.index === 29 ? { ...d, status: 'session' as DayStatus } : d)),
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
            // Calendar index 29 = today; future days fall outside the 30-day
            // window, so a freeze for an upcoming day only spends the token.
            calendar: s.calendar.map((d) => (d.index === 29 + offsetDays ? { ...d, status: 'freeze' as DayStatus } : d)),
          },
    ),
}));
