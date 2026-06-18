// In-session user store (Task 1b + Task 2) — the user's profile and body metrics.
// Seeded from mock; onboarding writes the real answers here on completion, and the
// goal-derivation reads these metrics so the dashboard reflects the user's actual
// numbers. No cross-restart persistence (backend).
import { create } from 'zustand';

import { mockUser } from '@/lib/mock/data';

export type Sex = 'male' | 'female' | 'other';
export type GoalType = 'lose' | 'muscle' | 'consistency' | 'eat-better' | 'sleep' | 'health';
export type Units = 'metric' | 'imperial';

export type UserProfile = {
  name: string;
  email: string;
  avatarUri?: string;
  memberSince: string;
  // Body metrics (canonical SI) — used for goal derivation.
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  goal: GoalType;
  targetWeightKg: number;
  // Activity: gym sessions/week the user targets (drives the activity factor).
  gymTargetPerWeek: number;
  // Dietary prefs carried from onboarding (display + later meal suggestions).
  restrictions: string[];
  allergies: string[];
  cuisines: string[];
};

// Sensible defaults (used until onboarding fills them in).
const DEFAULT_PROFILE: UserProfile = {
  name: mockUser.name,
  email: mockUser.email,
  avatarUri: mockUser.avatarUri,
  memberSince: mockUser.memberSince,
  weightKg: 82,
  heightCm: 178,
  age: 28,
  sex: 'male',
  goal: 'lose',
  targetWeightKg: 75,
  gymTargetPerWeek: 4,
  restrictions: [],
  allergies: [],
  cuisines: [],
};

type UserState = {
  profile: UserProfile;
  setProfile: (patch: Partial<UserProfile>) => void;
  resetProfile: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  profile: DEFAULT_PROFILE,
  setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
  resetProfile: () => set({ profile: DEFAULT_PROFILE }),
}));
