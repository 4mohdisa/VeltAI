// Settings store (mock persistence) — the user's owned preferences that the rest
// of the app reads at the display boundary: unit preferences, app language, and
// custom calorie/macro goals. Real persistence is backend (Phase 12); for now
// this is an in-memory zustand store seeded from mock defaults.
import { create } from 'zustand';

import {
  DEFAULT_UNIT_PREFERENCES,
  IMPERIAL_PREFERENCES,
  METRIC_PREFERENCES,
  type UnitDimension,
  type UnitPreferences,
} from '@/lib/units';
import { mockMacros, mockUser } from '@/lib/mock/data';

// --- Goals ------------------------------------------------------------------
// All canonical: calories in kcal, macros in grams.
export type GoalMode = 'ai' | 'custom';
export type MacroSplitBy = 'grams' | 'percent';
export type MacroGoals = { calories: number; protein: number; carbs: number; fat: number; fibre: number };

// The AI recommendation = the onboarding-derived targets in mock data.
export const AI_GOALS: MacroGoals = {
  calories: mockMacros.calories.target,
  protein: mockMacros.protein.target,
  carbs: mockMacros.carbs.target,
  fat: mockMacros.fat.target,
  fibre: mockMacros.fibre.target,
};

const seedUnits: UnitPreferences =
  mockUser.units === 'imperial' ? IMPERIAL_PREFERENCES : mockUser.units === 'metric' ? METRIC_PREFERENCES : DEFAULT_UNIT_PREFERENCES;

type SettingsState = {
  units: UnitPreferences;
  // null = follow the device language (System default); a code = manual override.
  languageOverride: string | null;
  goalMode: GoalMode;
  customGoals: MacroGoals;
  macroSplitBy: MacroSplitBy;

  setSystem: (system: 'metric' | 'imperial') => void;
  setUnit: (dimension: UnitDimension, value: string) => void;
  setLanguage: (lang: string | null) => void; // null → System default

  setGoalMode: (mode: GoalMode) => void;
  setCustomGoals: (patch: Partial<MacroGoals>) => void;
  setMacroSplitBy: (by: MacroSplitBy) => void;
  resetGoalsToAi: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  units: seedUnits,
  languageOverride: null,
  goalMode: 'ai',
  customGoals: AI_GOALS,
  macroSplitBy: 'grams',

  setSystem: (system) => set({ units: system === 'imperial' ? IMPERIAL_PREFERENCES : METRIC_PREFERENCES }),
  setUnit: (dimension, value) =>
    set((s) => ({ units: { ...s.units, [dimension]: value } as UnitPreferences })),
  setLanguage: (languageOverride) => set({ languageOverride }),

  setGoalMode: (goalMode) => set({ goalMode }),
  setCustomGoals: (patch) => set((s) => ({ customGoals: { ...s.customGoals, ...patch } })),
  setMacroSplitBy: (macroSplitBy) => set({ macroSplitBy }),
  resetGoalsToAi: () => set({ customGoals: AI_GOALS }),
}));

// --- Selectors --------------------------------------------------------------

/** The macro/calorie targets the app should actually use right now. */
export function useEffectiveGoals(): MacroGoals {
  return useSettingsStore((s) => (s.goalMode === 'custom' ? s.customGoals : AI_GOALS));
}

export function useUnitPreferences(): UnitPreferences {
  return useSettingsStore((s) => s.units);
}
