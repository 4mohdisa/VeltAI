// In-session user store (Task 1b + Task 2) — the user's profile and body metrics.
// Seeded from mock; onboarding writes the real answers here on completion, and the
// goal-derivation reads these metrics so the dashboard reflects the user's actual
// numbers. No cross-restart persistence (backend).
import { create } from 'zustand';

import { mockUser } from '@/lib/mock/data';
import type { ActivityLevel } from '@/lib/types';
import { isDevBuild } from '@/lib/env';

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
  // Activity: gym sessions/week the user targets (display + gym screens).
  gymTargetPerWeek: number;
  // The activity level chosen during onboarding. This — NOT gymTargetPerWeek —
  // is what feeds the calorie derivation, because it is the same input the
  // backend and the onboarding preview use. Keeping two different inputs meant
  // onboarding showed one calorie target and the dashboard showed another.
  activityLevel: ActivityLevel;
  // Dietary prefs carried from onboarding (display + later meal suggestions).
  restrictions: string[];
  allergies: string[];
  cuisines: string[];
};

// Identity defaults. In a RELEASE build these are EMPTY: showing a fabricated
// name and email as the signed-in user's own is dishonest, is an App Store 2.1
// rejection, and was shipping here until the pre-submission audit — the Account
// screen displayed "Bilal Ahmed / bilal.ahmed@example.com" to every real user,
// permanently, because nothing ever hydrated the profile from the server.
// Dev builds keep the mock so the keyless offline experience stays navigable.
const seededIdentity = isDevBuild()
  ? { name: mockUser.name, email: mockUser.email, avatarUri: mockUser.avatarUri, memberSince: mockUser.memberSince }
  : { name: '', email: '', avatarUri: undefined as string | undefined, memberSince: '' };

// Body-metric defaults are NOT identity: they feed goal derivation, so a
// release build must not invent them either — a target computed from a
// fictional 82 kg 28-year-old is exactly the unsafe-target risk 1.4.1 covers.
// Zeroes make "no body stats yet" explicit; deriveGoals already floors output.
const seededBody = isDevBuild()
  ? { weightKg: 82, heightCm: 178, age: 28, targetWeightKg: 75 }
  : { weightKg: 0, heightCm: 0, age: 0, targetWeightKg: 0 };

// Sensible defaults (used until onboarding fills them in).
const DEFAULT_PROFILE: UserProfile = {
  ...seededIdentity,
  ...seededBody,
  sex: 'other',
  goal: 'lose',
  activityLevel: 'sedentary',
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
