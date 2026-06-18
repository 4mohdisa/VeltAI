// Data-access hooks (Task 1) — the ONE seam between screens and data. Today each
// hook returns mock (via the in-session stores) shaped like real async access:
// { data, isLoading, error, refetch }, mirroring what React Query will provide in
// the backend phase. When the backend lands, the body of each hook swaps to a real
// query — screens don't change. Reads are reactive (zustand); writes are imperative
// mutation functions (see ./mutations + ./scan), mirroring useQuery/mutate.
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useFoodStore, type StoredMeal } from './foodStore';
import { useGymStore, type Streak } from './gymStore';
import { useUserStore, type UserProfile } from './userStore';
import { useEffectiveGoals, type MacroGoals } from '@/lib/settings/store';
import {
  foodCatalog,
  mockHealth,
  mockMacros,
  mockMealHistory,
  mockPlan,
  mockPlanReason,
  mockSubscription,
  mockUpcomingDays,
  recentFoods,
  type DayStatus,
  type FoodResult,
  type GymSession,
  type MacroKey,
  type MealHistoryDay,
  type UpcomingDay,
} from '@/lib/mock/data';

export type Async<T> = { data: T; isLoading: boolean; error: Error | null; refetch: () => void };

/** First-load shim — mimics a fetch's loading window so the UI's skeleton/empty/
 *  error slots are exercised now and reusable when the real fetch arrives. */
function useInitialLoad(delay = 600): { isLoading: boolean; error: Error | null; refetch: () => void } {
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<Error | null>(null);
  const refetch = useCallback(() => {
    setIsLoading(true);
    const id = setTimeout(() => setIsLoading(false), delay);
    return () => clearTimeout(id);
  }, [delay]);
  useEffect(() => refetch(), [refetch]);
  return { isLoading, error, refetch };
}

// --- Food log ---------------------------------------------------------------

export function useFoodLog(): Async<StoredMeal[]> {
  const data = useFoodStore((s) => s.meals);
  const { isLoading, error, refetch } = useInitialLoad(700);
  return { data, isLoading, error, refetch };
}

export function useMeal(mealId: string | undefined): StoredMeal | undefined {
  return useFoodStore((s) => s.meals.find((m) => m.id === mealId));
}

export function useSavedFoods(): Async<ReturnType<typeof selectSaved>> {
  const data = useFoodStore(selectSaved);
  const { isLoading, error, refetch } = useInitialLoad(600);
  return { data, isLoading, error, refetch };
}
const selectSaved = (s: ReturnType<typeof useFoodStore.getState>) => s.savedFoods;

/** Manual search over the mock catalog + recents (synchronous, no loading slot). */
export function useFoodSearch(query: string): { results: FoodResult[]; recents: FoodResult[] } {
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as FoodResult[];
    return foodCatalog.filter((r) => r.name.toLowerCase().includes(q) || r.brand?.toLowerCase().includes(q));
  }, [query]);
  return { results, recents: recentFoods };
}

export function useMealHistory(): Async<MealHistoryDay[]> {
  const { isLoading, error, refetch } = useInitialLoad(600);
  return { data: mockMealHistory, isLoading, error, refetch };
}

// --- Macro totals (consumed derived from logged meals; targets from goals) ---

export type MacroTotals = Record<MacroKey, { consumed: number; target: number }>;

export function useDailyMacros(): MacroTotals {
  const meals = useFoodStore((s) => s.meals);
  const goals = useEffectiveGoals();
  return useMemo(() => {
    const c = meals.reduce(
      (a, m) => ({
        calories: a.calories + m.calories,
        protein: a.protein + m.protein,
        carbs: a.carbs + m.carbs,
        fat: a.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return {
      calories: { consumed: c.calories, target: goals.calories },
      protein: { consumed: c.protein, target: goals.protein },
      carbs: { consumed: c.carbs, target: goals.carbs },
      fat: { consumed: c.fat, target: goals.fat },
      // Fibre isn't tracked per food item in the mock model — keep a static
      // consumed placeholder; target is the goal. (Backend will track it per item.)
      fibre: { consumed: mockMacros.fibre.consumed, target: goals.fibre },
    };
  }, [meals, goals]);
}

// --- Gym --------------------------------------------------------------------

export type GymData = {
  streak: Streak;
  calendar: { index: number; status: DayStatus }[];
  sessions: GymSession[];
  upcoming: UpcomingDay[];
};

export function useGym(): Async<GymData> {
  const streak = useGymStore((s) => s.streak);
  const calendar = useGymStore((s) => s.calendar);
  const sessions = useGymStore((s) => s.sessions);
  const { isLoading, error, refetch } = useInitialLoad(600);
  return { data: { streak, calendar, sessions, upcoming: mockUpcomingDays }, isLoading, error, refetch };
}

// --- Goals + profile --------------------------------------------------------

export function useGoals(): MacroGoals {
  return useEffectiveGoals();
}

export function useUserProfile(): UserProfile {
  return useUserStore((s) => s.profile);
}

// --- Dashboard --------------------------------------------------------------

export function useDashboard() {
  const profile = useUserStore((s) => s.profile);
  const streak = useGymStore((s) => s.streak);
  const macros = useDailyMacros();
  const { isLoading, error, refetch } = useInitialLoad(600);
  return { data: { profile, streak, macros, plan: mockPlan, planReason: mockPlanReason }, isLoading, error, refetch };
}

/** Today's AI plan (static mock for now). */
export function usePlan() {
  return { plan: mockPlan, reason: mockPlanReason };
}

/** Subscription / trial status (static mock for now). */
export function useSubscription() {
  return mockSubscription;
}

// --- Apple Health (already async-shaped in lib/healthkit) -------------------

export { mockHealth };
