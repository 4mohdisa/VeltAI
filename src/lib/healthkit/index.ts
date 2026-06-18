// Apple Health — exactly TWO flows (stubbed; react-native-health is not installed
// in this build, so these return mock data behind the same UI):
//   1. READ  active energy + steps  → calorie cross-check vs the daily goal.
//   2. WRITE  logged nutrition (calories + macros) → user-initiated only.
// Nothing else (no workouts, sleep, HRV, resting HR, VO2, correlations, or
// background delivery).
import { mockHealth } from '@/lib/mock/data';
import { useSettingsStore } from '@/lib/settings/store';

export type HealthToday = {
  /** false when Health is denied/unavailable → callers fall back to intake-only. */
  connected: boolean;
  activeEnergy: number; // kcal burned today (HKQuantityTypeIdentifier.activeEnergyBurned)
  steps: number; //       step count today (HKQuantityTypeIdentifier.stepCount)
};

/** Read today's active energy + steps. Real device → HealthKit; here → mock,
 *  gated by the user's connection toggle (stub) so the cross-check reflects it. */
export async function readActiveEnergyAndSteps(): Promise<HealthToday> {
  const connected = useSettingsStore.getState().healthConnected;
  if (!connected) return { connected: false, activeEnergy: 0, steps: 0 };
  return { ...mockHealth, connected: true };
}

export type NutritionPayload = {
  calories: number; // dietaryEnergyConsumed
  protein: number; //  dietaryProtein
  carbs: number; //    dietaryCarbohydrates
  fat: number; //      dietaryFatTotal
};

/** Write a logged meal's nutrition to Apple Health. USER-INITIATED only — never
 *  automatic. Stubbed (returns true); real device writes the four dietary types. */
export async function writeNutritionToHealth(_payload: NutritionPayload): Promise<boolean> {
  return true;
}
