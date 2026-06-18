// In-session gym store (Task 1b) — streak, 30-day calendar, and session history,
// seeded from mock. Logging a session updates the streak + marks today + prepends
// a session so the change is consistent across the Gym and Dashboard tabs within a
// session. No cross-restart persistence (backend).
import { create } from 'zustand';

import { mockGymCalendar, mockGymSessions, mockStreak, type DayStatus, type GymSession } from '@/lib/mock/data';

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

  /** Log today's gym session: marks today, extends the streak, prepends history. */
  logGymSession: (session?: Partial<Omit<GymSession, 'id' | 'date'>>) => void;
  /** Spend a freeze token to protect the streak today. */
  applyFreeze: () => void;
};

export const useGymStore = create<GymState>((set) => ({
  streak: { ...mockStreak },
  calendar: mockGymCalendar.map((d) => ({ ...d })),
  sessions: mockGymSessions.map((s) => ({ ...s })),

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

  applyFreeze: () =>
    set((s) =>
      s.streak.freezesAvailable <= 0
        ? s
        : {
            streak: { ...s.streak, freezesAvailable: s.streak.freezesAvailable - 1 },
            calendar: s.calendar.map((d) => (d.index === 29 ? { ...d, status: 'freeze' as DayStatus } : d)),
          },
    ),
}));
