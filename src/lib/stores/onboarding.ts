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

const EMPTY: OnboardingSession & { completed: boolean } = {
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
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...EMPTY,
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
      name: 'lumo.onboarding',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);

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
