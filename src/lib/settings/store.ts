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
import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from '@/lib/notifications/types';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import type { Sex } from '@/lib/types';

// --- Goals ------------------------------------------------------------------
// All canonical: calories in kcal, macros in grams.
export type GoalMode = 'ai' | 'custom';
export type MacroSplitBy = 'grams' | 'percent';
export type MacroGoals = { calories: number; protein: number; carbs: number; fat: number; fibre: number };

/** The server's own view of entitlement (GET /api/subscription), mapped by
 *  entitlementFromApi. Null when the server has no opinion yet — see
 *  hydrateSubscription in @/lib/data/hooks. */
export type ServerEntitlement = { isActive: boolean; status: string } | null;

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
  /** The signed-in user's goals row from GET /api/goals, mapped by
   *  goalsFromApi; null before hydration lands or when no row exists yet.
   *  Read by useEffectiveGoals() ahead of the local derivation. */
  serverGoals: MacroGoals | null;
  /** The signed-in user's entitlement from GET /api/subscription, mapped by
   *  entitlementFromApi. Null before hydration lands or when the server has
   *  no row yet — the Subscription screen then keeps RevenueCat's own view. */
  serverEntitlement: ServerEntitlement;
  macroSplitBy: MacroSplitBy;
  notifications: NotificationSettings;
  // First-party product analytics (OPT-IN as of 2026-08-09 — DECISIONS.md).
  // Defaults to false: nothing is collected until the user answers the
  // consolidated disclosure in src/lib/ai/consent.ts. Off → track() no-ops and
  // buffered events are discarded (src/lib/analytics).
  analyticsEnabled: boolean;

  setSystem: (system: 'metric' | 'imperial') => void;
  setUnit: (dimension: UnitDimension, value: string) => void;
  setLanguage: (lang: string | null) => void; // null → System default

  setGoalMode: (mode: GoalMode) => void;
  setCustomGoals: (patch: Partial<MacroGoals>) => void;
  setServerGoals: (goals: MacroGoals | null) => void;
  setServerEntitlement: (entitlement: ServerEntitlement) => void;
  setMacroSplitBy: (by: MacroSplitBy) => void;
  /** Saved on the device at once; re-read by hydrateNotificationSettings. */
  setNotifications: (patch: Partial<NotificationSettings>) => void;
  resetGoalsToAi: () => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  /** Sign-out: back to defaults. */
  reset: () => void;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  units: seedUnits,
  languageOverride: null,
  goalMode: 'ai',
  customGoals: aiGoals(), // seeds custom fields with the derived recommendation
  serverGoals: null,
  serverEntitlement: null,
  macroSplitBy: 'grams',
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  analyticsEnabled: false,

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
  setServerGoals: (serverGoals) => set({ serverGoals }),
  setServerEntitlement: (serverEntitlement) => set({ serverEntitlement }),
  setMacroSplitBy: (macroSplitBy) => set({ macroSplitBy }),
  setNotifications: (patch) => {
    const notifications = { ...get().notifications, ...patch };
    set({ notifications });
    void setItem(STORAGE_KEYS.notificationSettings, JSON.stringify(notifications));
  },
  resetGoalsToAi: () => set({ customGoals: aiGoals() }),
  setAnalyticsEnabled: (analyticsEnabled) => {
    set({ analyticsEnabled });
    // The privacy choice must survive restarts — persisted immediately,
    // re-read by initAnalytics() on the next launch. Under opt-in only an
    // explicit '1' turns collection back on; '0' and absent both mean no.
    void setItem(STORAGE_KEYS.analyticsEnabled, analyticsEnabled ? '1' : '0');
  },
  // Sign-out: back to defaults, analyticsEnabled INCLUDED. Under opt-out this
  // field was deliberately excluded so a sign-out could not re-enable
  // collection; under opt-in (2026-08-09) the default is false, so resetting it
  // is the safe direction and leaving it set would carry one account's consent
  // onto the next. resetRegistry deletes the persisted key to match.
  reset: () =>
    set({
      units: seedUnits,
      languageOverride: null,
      goalMode: 'ai',
      customGoals: aiGoals(),
      serverGoals: null,
      serverEntitlement: null,
      macroSplitBy: 'grams',
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
      analyticsEnabled: false,
    }),
}));

/** Re-applies the saved notification settings (the store re-seeds to defaults on
 *  every launch). Anything missing or unreadable falls back to the defaults, so
 *  promotional stays off unless the user opted in. */
export async function hydrateNotificationSettings(): Promise<void> {
  const raw = await getItem(STORAGE_KEYS.notificationSettings);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw) as Partial<NotificationSettings>;
    useSettingsStore.setState({
      notifications: {
        enabled: { ...DEFAULT_NOTIFICATION_SETTINGS.enabled, ...saved.enabled },
        quietHours: saved.quietHours === undefined ? DEFAULT_NOTIFICATION_SETTINGS.quietHours : saved.quietHours,
        promotionalOptIn: saved.promotionalOptIn === true,
      },
    });
  } catch {
    // unreadable → keep the defaults
  }
}

/** Safety band for a daily calorie target (see PUT /api/goals server-side). */
export const CALORIE_TARGET_MIN = 1200;
export const CALORIE_TARGET_MAX = 10000;

/**
 * Clamp a manually-entered calorie target into the SAME band the server
 * enforces. The floor is sex-aware (male 1500 / female 1200 / unspecified 1500),
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
 *  the goal mode, the custom values, the server's own goals row, and the user
 *  profile (so the derived recommendation updates when onboarding writes the
 *  user's real numbers). In 'ai' mode the server's goals row wins once
 *  hydrateGoals() has landed one — that row is what PUT /api/goals and
 *  onboarding both write, so it is the one real source of truth; this local
 *  derivation is only the fallback for no server row yet. */
export function useEffectiveGoals(): MacroGoals {
  const mode = useSettingsStore((s) => s.goalMode);
  const customGoals = useSettingsStore((s) => s.customGoals);
  const serverGoals = useSettingsStore((s) => s.serverGoals);
  const profile = useUserStore((s) => s.profile);
  if (mode === 'custom') return customGoals;
  return serverGoals ?? deriveGoals(profile);
}

export function useUnitPreferences(): UnitPreferences {
  return useSettingsStore((s) => s.units);
}
