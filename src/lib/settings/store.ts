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
import { calorieFloor } from '@/lib/onboarding/deriveTargets';
import { setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import type { Sex } from '@/lib/types';

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

// --- Notifications ----------------------------------------------------------
export type NotificationPrefs = {
  gymReminder: boolean;
  mealReminders: boolean;
  streakAtRisk: boolean;
  aiNudges: boolean;
  weeklyRecap: boolean;
  quietFrom: Date;
  quietTo: Date;
};

// Today at the given hour/minute (quiet-hours default seed).
function timeToday(hours: number, minutes: number): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const defaultNotificationPrefs = (): NotificationPrefs => ({
  gymReminder: true,
  mealReminders: true,
  streakAtRisk: true,
  aiNudges: true,
  weeklyRecap: false,
  quietFrom: timeToday(22, 0),
  quietTo: timeToday(7, 0),
});

const seedUnits: UnitPreferences =
  mockUser.units === 'imperial' ? IMPERIAL_PREFERENCES : mockUser.units === 'metric' ? METRIC_PREFERENCES : DEFAULT_UNIT_PREFERENCES;

type SettingsState = {
  units: UnitPreferences;
  // null = follow the device language (System default); a code = manual override.
  languageOverride: string | null;
  goalMode: GoalMode;
  customGoals: MacroGoals;
  macroSplitBy: MacroSplitBy;
  notificationPrefs: NotificationPrefs;
  // First-party product analytics (opt-out). Off → track() no-ops and buffered
  // events are discarded (src/lib/analytics).
  analyticsEnabled: boolean;

  setSystem: (system: 'metric' | 'imperial') => void;
  setUnit: (dimension: UnitDimension, value: string) => void;
  setLanguage: (lang: string | null) => void; // null → System default

  setGoalMode: (mode: GoalMode) => void;
  setCustomGoals: (patch: Partial<MacroGoals>) => void;
  setMacroSplitBy: (by: MacroSplitBy) => void;
  setNotificationPrefs: (patch: Partial<NotificationPrefs>) => void;
  resetGoalsToAi: () => void;
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
  notificationPrefs: defaultNotificationPrefs(),
  analyticsEnabled: true,

  setSystem: (system) => set({ units: system === 'imperial' ? IMPERIAL_PREFERENCES : METRIC_PREFERENCES }),
  setUnit: (dimension, value) =>
    set((s) => ({ units: { ...s.units, [dimension]: value } as UnitPreferences })),
  setLanguage: (languageOverride) => set({ languageOverride }),

  setGoalMode: (goalMode) => set({ goalMode }),
  // Calorie safety (1.4.1): a custom target outside the safe band is clamped —
  // the app must never store a starvation-level (or absurd) goal. The floor is
  // sex-aware and read from the profile (see clampCalories); PUT /api/goals
  // enforces the same band from the stored onboarding sex.
  setCustomGoals: (patch) =>
    set((s) => ({
      customGoals: {
        ...s.customGoals,
        ...patch,
        ...(patch.calories != null ? { calories: clampCalories(patch.calories) } : {}),
      },
    })),
  setMacroSplitBy: (macroSplitBy) => set({ macroSplitBy }),
  setNotificationPrefs: (patch) =>
    set((s) => ({ notificationPrefs: { ...s.notificationPrefs, ...patch } })),
  resetGoalsToAi: () => set({ customGoals: aiGoals() }),
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
      notificationPrefs: defaultNotificationPrefs(),
    }),
}));

/** Safety band for a daily calorie target (see PUT /api/goals server-side). */
export const CALORIE_TARGET_MIN = 1200;
export const CALORIE_TARGET_MAX = 10000;

/**
 * Clamp a manually-entered calorie target into the SAME band the server
 * enforces. The floor is sex-aware (male 1500 / female 1200 / other 1350),
 * matching `calorieFloor` on both sides of the wire.
 *
 * Found on a real simulator run, 2026-08-06: this used to clamp to a flat
 * 1200 while the server floor had become sex-aware, so a male user who
 * adjusted their target to 1200–1499 was allowed to save it here and then hit
 * a 400 from the server — which, on the onboarding targets screen, means
 * onboarding cannot be completed at all. A client floor must never be LOWER
 * than the server's.
 *
 * `sex` is explicit where the caller knows it better than the profile store
 * does — during onboarding the answers live in the onboarding store and the
 * profile still holds its default.
 */
export function clampCalories(n: number, sex?: Sex): number {
  const min = calorieFloor(sex ?? useUserStore.getState().profile.sex);
  return Math.min(CALORIE_TARGET_MAX, Math.max(min, Math.round(n)));
}

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
