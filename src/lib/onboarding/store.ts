// Onboarding answers, held in a zustand store for the duration of the flow.
// Lets later screens reflect earlier answers (A7 reflection, A15 wow) and feeds
// the (mocked) plan generation. Backend persistence is out of scope tonight.
import { create } from 'zustand';

export type Sex = 'male' | 'female' | 'other';
export type GoalType = 'lose' | 'muscle' | 'consistency' | 'eat-better' | 'sleep' | 'health';
export type Units = 'metric' | 'imperial';
export type CookStyle = 'cook' | 'eat-out' | 'both';

export type OnboardingAnswers = {
  struggles: string[];
  pastAttempts: string[];
  frustrations: string[];
  frustrationText: string;
  goal: GoalType;
  targetWeight: number;
  whyText: string;
  weight: number;
  height: number;
  age: number;
  sex: Sex;
  units: Units;
  wakeTime: string;
  sleepTime: string;
  gymTime: string;
  gymCurrent: number;
  gymTarget: number;
  mealsPerDay: number;
  restrictions: string[];
  allergies: string[];
  cuisines: string[];
  cooksAtHome: CookStyle;
};

type OnboardingStore = OnboardingAnswers & {
  set: (patch: Partial<OnboardingAnswers>) => void;
  toggle: (key: ArrayKey, value: string) => void;
  reset: () => void;
};

type ArrayKey = {
  [K in keyof OnboardingAnswers]: OnboardingAnswers[K] extends string[] ? K : never;
}[keyof OnboardingAnswers];

const DEFAULTS: OnboardingAnswers = {
  struggles: [],
  pastAttempts: [],
  frustrations: [],
  frustrationText: '',
  goal: 'lose',
  targetWeight: 75,
  whyText: '',
  weight: 82,
  height: 178,
  age: 28,
  sex: 'male',
  units: 'metric',
  wakeTime: '06:30',
  sleepTime: '22:30',
  gymTime: '18:00',
  gymCurrent: 1,
  gymTarget: 4,
  mealsPerDay: 3,
  restrictions: [],
  allergies: [],
  cuisines: [],
  cooksAtHome: 'both',
};

export const useOnboarding = create<OnboardingStore>((set) => ({
  ...DEFAULTS,
  set: (patch) => set(patch),
  toggle: (key, value) =>
    set((state) => {
      const current = state[key];
      return {
        [key]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      } as Partial<OnboardingAnswers>;
    }),
  reset: () => set(DEFAULTS),
}));
