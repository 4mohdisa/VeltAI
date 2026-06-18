// Mutations (Task 1) — imperative writes through the data seam, mirroring React
// Query's `mutate`. They update the in-session stores so edits persist across
// navigation. When the backend lands, these call the API (optionally optimistic)
// without screens changing.
import { useFoodStore, type NewFoodItem } from './foodStore';
import { useGymStore } from './gymStore';
import { useUserStore, type UserProfile } from './userStore';
import { useSettingsStore, type MacroGoals } from '@/lib/settings/store';
import type { EntryMethod, MealSlot, SavedFood } from '@/lib/mock/data';

const food = () => useFoodStore.getState();
const gym = () => useGymStore.getState();
const settings = () => useSettingsStore.getState();

// --- Food log ---
export const logMeal = (slot: MealSlot, item: NewFoodItem, method: EntryMethod = 'manual', pending = false): string =>
  food().logMeal(slot, item, method, pending);
export const editFoodItem = (itemId: string, patch: Partial<NewFoodItem>) => food().editFoodItem(itemId, patch);
export const deleteFoodItem = (itemId: string) => food().deleteFoodItem(itemId);

// --- Saved foods ---
export const saveFood = (f: Omit<SavedFood, 'id'>) => food().saveFood(f);
export const editSavedFood = (id: string, patch: Partial<SavedFood>) => food().editSavedFood(id, patch);
export const unsaveFood = (id: string) => food().unsaveFood(id);

// --- Gym ---
export const logGymSession = (session?: Parameters<ReturnType<typeof useGymStore.getState>['logGymSession']>[0]) =>
  gym().logGymSession(session);
export const applyFreeze = () => gym().applyFreeze();

// --- Goals ---
/** Switch to custom goals and patch them (used by the Goals editor). */
export const setGoals = (patch: Partial<MacroGoals>) => {
  settings().setGoalMode('custom');
  settings().setCustomGoals(patch);
};

// --- User profile (onboarding bridge writes here) ---
export const setUserProfile = (patch: Partial<UserProfile>) => useUserStore.getState().setProfile(patch);
