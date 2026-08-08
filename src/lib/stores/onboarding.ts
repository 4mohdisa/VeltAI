// Onboarding progress store — survives app restarts so a user who quits mid-flow
// resumes where they left off. Persisted via expo-secure-store (see
// ./secureStorage). Cleared on markCompleted so a fresh install / re-onboard
// starts blank.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { secureStorage } from './secureStorage';
import type {
  ActivityLevel,
  BodyType,
  CuisineType,
  DietaryRequirement,
  Goal,
  OnboardingSession,
  Sex,
} from '@/lib/types';

type Measurements = {
  age?: number | null;
  sex?: Sex | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  target_weight_kg?: number | null;
};

type OnboardingState = OnboardingSession & {
  completed: boolean;
  /**
   * The onboarding route the user last had on screen, persisted with the
   * answers. Without it a reload dropped everyone back at Welcome no matter
   * how far they had got: the answers survived, the POSITION did not, so the
   * flow *looked* like it had lost everything (audit 2026-08-08).
   */
  last_step: string | null;
  setLastStep: (route: string) => void;
  setGoal: (goal: Goal) => void;
  setActivity: (level: ActivityLevel) => void;
  setCuisines: (cuisines: CuisineType[]) => void;
  setDietaryReqs: (reqs: DietaryRequirement[]) => void;
  setMeasurements: (m: Measurements) => void;
  setCalorieTarget: (calories: number | null) => void;
  setBodyType: (bodyType: BodyType) => void;
  markCompleted: () => void;
  reset: () => void;
};

const EMPTY: OnboardingSession & { completed: boolean; last_step: string | null } = {
  goal: null,
  activity_level: null,
  cuisines: [],
  dietary_requirements: [],
  age: null,
  sex: null,
  height_cm: null,
  weight_kg: null,
  target_weight_kg: null,
  calorie_target: null,
  body_type: null,
  completed: false,
  last_step: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...EMPTY,
      setLastStep: (last_step) => set({ last_step }),
      setGoal: (goal) => set({ goal }),
      setActivity: (activity_level) => set({ activity_level }),
      setCuisines: (cuisines) => set({ cuisines }),
      setDietaryReqs: (dietary_requirements) => set({ dietary_requirements }),
      setMeasurements: (m) => set((s) => ({ ...s, ...m })),
      setCalorieTarget: (calorie_target) => set({ calorie_target }),
      setBodyType: (body_type) => set({ body_type }),
      markCompleted: () => set({ completed: true }),
      reset: () => set({ ...EMPTY }),
    }),
    {
      name: 'lume.onboarding',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);

/**
 * Client-side mirror of what POST /api/onboarding will accept, checked BEFORE
 * the request so a rejection is never the user's first sign of trouble.
 *
 * Every rule here exists on the server (backend/internal/goals/goals.go
 * postOnboarding): required age/sex/height/weight/activity/goal, age 13..120,
 * positive measurements, body_type from a known set. Keep the two in step —
 * this project has already shipped a validator that would have 400'd its own
 * client, and a hermetic suite could not see it.
 *
 * Returns null when the payload is good, or the reason it is not.
 */
export function validateOnboardingPayload(s: OnboardingSession): string | null {
  if (s.age == null) return 'Add your age before finishing setup.';
  if (s.age < 13 || s.age > 120) return 'Your age must be between 13 and 120.';
  // The server requires a sex; the payload used to substitute 'other' for an
  // unanswered question, quietly deciding something the user never did — and
  // sex moves the BMR by 166 kcal and sets the safety floor.
  if (s.sex == null) return 'Choose an option for sex before finishing setup.';
  if (s.height_cm == null || s.height_cm <= 0) return 'Add your height before finishing setup.';
  if (s.weight_kg == null || s.weight_kg <= 0) return 'Add your weight before finishing setup.';
  if (s.activity_level == null) return 'Choose your activity level before finishing setup.';
  if (s.goal == null) return 'Choose your goal before finishing setup.';
  if (s.target_weight_kg != null && (s.target_weight_kg <= 0 || s.target_weight_kg > 1000)) {
    return 'Your target weight looks wrong — check it before finishing setup.';
  }
  return null;
}

/** Assemble the collected answers into the POST /api/onboarding payload. */
export function onboardingPayload(s: OnboardingSession): {
  age: number;
  sex: string;
  height: number;
  height_unit: string;
  weight: number;
  weight_unit: string;
  activity_level: string;
  goal: string;
  cuisines: string[];
  dietary_requirements: string[];
  body_type?: string;
  target_weight?: number;
  calorie_target?: number;
} {
  return {
    age: s.age ?? 0,
    sex: s.sex ?? 'other',
    height: s.height_cm ?? 0,
    height_unit: 'cm', // stored canonical; the UI toggles display units only
    weight: s.weight_kg ?? 0,
    weight_unit: 'kg',
    activity_level: s.activity_level ?? 'sedentary',
    goal: s.goal ?? 'track',
    cuisines: s.cuisines,
    dietary_requirements: s.dietary_requirements,
    // Optional — omitted when not selected (backend treats it as optional).
    ...(s.body_type ? { body_type: s.body_type } : {}),
    // Both of these were collected by real screens and then dropped on the
    // floor: they were never in this payload, so the target-weight field was
    // decoration and "Adjust manually" changed a number that nothing read.
    ...(s.target_weight_kg ? { target_weight: s.target_weight_kg } : {}),
    ...(s.calorie_target ? { calorie_target: s.calorie_target } : {}),
  };
}
