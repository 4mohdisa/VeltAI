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
import { mockUser } from '@/lib/mock/data';
import { useUserStore } from '@/lib/data/userStore';
import { deriveGoals } from '@/lib/goals/derive';
import { setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';

// --- Goals ------------------------------------------------------------------
// All canonical: calories in kcal, macros in grams.
export type GoalMode = 'ai' | 'custom';
export type MacroSplitBy = 'grams' | 'percent';
export type MacroGoals = { calories: number; protein: number; carbs: number; fat: number; fibre: number };

/** The "AI recommendation" — derived from the user's onboarding profile (Task 2),
 *  no longer a hardcoded mock target. Stays editable via the custom override. */
export function aiGoals(): MacroGoals {
  return deriveGoals(useUserStore.getState().profile);
}

const seedUnits: UnitPreferences =
  mockUser.units === 'imperial' ? IMPERIAL_PREFERENCES : mockUser.units === 'metric' ? METRIC_PREFERENCES : DEFAULT_UNIT_PREFERENCES;

type SettingsState = {
  units: UnitPreferences;
  // null = follow the device language (System default); a code = manual override.
  languageOverride: string | null;
  goalMode: GoalMode;
  customGoals: MacroGoals;
  macroSplitBy: MacroSplitBy;
  // Apple Health connection (stub — real authorization is the native-build phase).
  healthConnected: boolean;
  // First-party product analytics (opt-out). Off → track() no-ops and buffered
  // events are discarded (src/lib/analytics).
  analyticsEnabled: boolean;

  setSystem: (system: 'metric' | 'imperial') => void;
  setUnit: (dimension: UnitDimension, value: string) => void;
  setLanguage: (lang: string | null) => void; // null → System default

  setGoalMode: (mode: GoalMode) => void;
  setCustomGoals: (patch: Partial<MacroGoals>) => void;
  setMacroSplitBy: (by: MacroSplitBy) => void;
  resetGoalsToAi: () => void;
  setHealthConnected: (connected: boolean) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  /** Sign-out: back to defaults. */
  reset: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  units: seedUnits,
  languageOverride: null,
  goalMode: 'ai',
  customGoals: aiGoals(), // seeds custom fields with the derived recommendation
  macroSplitBy: 'grams',
  healthConnected: true,
  analyticsEnabled: true,

  setSystem: (system) => set({ units: system === 'imperial' ? IMPERIAL_PREFERENCES : METRIC_PREFERENCES }),
  setUnit: (dimension, value) =>
    set((s) => ({ units: { ...s.units, [dimension]: value } as UnitPreferences })),
  setLanguage: (languageOverride) => set({ languageOverride }),

  setGoalMode: (goalMode) => set({ goalMode }),
  setCustomGoals: (patch) => set((s) => ({ customGoals: { ...s.customGoals, ...patch } })),
  setMacroSplitBy: (macroSplitBy) => set({ macroSplitBy }),
  resetGoalsToAi: () => set({ customGoals: aiGoals() }),
  setHealthConnected: (healthConnected) => set({ healthConnected }),
  setAnalyticsEnabled: (analyticsEnabled) => {
    set({ analyticsEnabled });
    // The privacy opt-out must survive restarts — persisted immediately,
    // re-read by initAnalytics() on the next launch.
    void setItem(STORAGE_KEYS.analyticsEnabled, analyticsEnabled ? '1' : '0');
  },
  // Sign-out: back to defaults — EXCEPT analyticsEnabled: an opt-out is a
  // privacy choice, not a preference; signing out must never re-enable
  // collection (see the privacy policy's "off means fully off").
  reset: () =>
    set({
      units: seedUnits,
      languageOverride: null,
      goalMode: 'ai',
      customGoals: aiGoals(),
      macroSplitBy: 'grams',
      healthConnected: true,
    }),
}));

// --- Selectors --------------------------------------------------------------

/** The macro/calorie targets the app should actually use right now. Reactive to
 *  both the goal mode/custom values AND the user profile (so the derived
 *  recommendation updates when onboarding writes the user's real numbers). */
export function useEffectiveGoals(): MacroGoals {
  const mode = useSettingsStore((s) => s.goalMode);
  const customGoals = useSettingsStore((s) => s.customGoals);
  const profile = useUserStore((s) => s.profile);
  return mode === 'custom' ? customGoals : deriveGoals(profile);
}

export function useUnitPreferences(): UnitPreferences {
  return useSettingsStore((s) => s.units);
}
