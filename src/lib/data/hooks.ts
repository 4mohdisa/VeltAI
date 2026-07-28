// Data-access hooks — the ONE seam between screens and data. Reads are reactive
// (zustand stores as the cache); on mount each wired hook attempts the real API
// fetch and hydrates its store on success. On failure (backend down / not signed
// in) the mock-seeded store data IS the offline experience — no crash, error
// stays null. Writes are imperative mutation functions (see ./mutations + ./scan)
// that update the store optimistically and fire the API call in the background.
import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { isServerId, mealsFromLogs, savedFoodFromApi, sessionsFromApi, streakFromApi, todayISO } from './mappers';
import { hasPendingCreate } from './mutations';
import { useFoodStore, type StoredFoodItem, type StoredMeal } from './foodStore';
import { useGymStore, type Streak } from './gymStore';
import { useUserStore, type UserProfile } from './userStore';
import { useEffectiveGoals, type MacroGoals } from '@/lib/settings/store';
import {
  foodCatalog,
  mockMacros,
  mockPlan,
  mockPlanReason,
  mockUpcomingDays,
  recentFoods,
  type DayStatus,
  type FoodResult,
  type GymSession,
  type MacroKey,
  type UpcomingDay,
} from '@/lib/mock/data';

export type Async<T> = { data: T; isLoading: boolean; error: Error | null; refetch: () => void };

/** First-load shim — mimics a fetch's loading window so the UI's skeleton/empty/
 *  error slots are exercised for the hooks that are still mock-backed. */
function useInitialLoad(delay = 600): { isLoading: boolean; error: Error | null; refetch: () => void } {
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<Error | null>(null);
  const refetch = useCallback(() => {
    setIsLoading(true);
    const id = setTimeout(() => setIsLoading(false), delay);
    return () => clearTimeout(id);
  }, [delay]);
  // Mount: isLoading already starts true, so just schedule the clear directly —
  // calling refetch() here would setState synchronously inside the effect.
  useEffect(() => {
    const id = setTimeout(() => setIsLoading(false), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return { isLoading, error, refetch };
}

/** Real-fetch shim — on mount, attempt the API and hydrate the store; on failure
 *  fall back silently to the mock-seeded store (the offline experience). Error
 *  stays null on fallback by design. */
function useHydration(hydrate: () => Promise<void>): { isLoading: boolean; error: Error | null; refetch: () => void } {
  const [isLoading, setIsLoading] = useState(true);
  const refetch = useCallback(() => {
    setIsLoading(true);
    hydrate()
      .catch((e: unknown) => {
        if (__DEV__) console.warn('[data] API unreachable, using local data:', e instanceof Error ? e.message : e);
      })
      .finally(() => setIsLoading(false));
  }, [hydrate]);
  // Mount: isLoading already starts true, so hydrate directly rather than calling
  // refetch() (whose synchronous setIsLoading(true) is the flagged set-state-in-effect).
  useEffect(() => {
    let alive = true;
    hydrate()
      .catch((e: unknown) => {
        if (__DEV__) console.warn('[data] API unreachable, using local data:', e instanceof Error ? e.message : e);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [hydrate]);
  return { isLoading, error: null, refetch };
}

// Hydration must not wipe local rows the server can't know about yet: pending
// scan skeletons (resolvePending still needs to find them), scanned rows awaiting
// review or in a failed state (status 'ready'/'failed' — not yet confirmed to the
// server), and optimistic creates whose round-trip hasn't landed (tracked in
// mutations' pending-create map). Rows with server ids — and the mock seed, which
// is none of the above — are replaced wholesale by the fetch.
const keepAcrossHydration = (it: { id: string; pending?: boolean; status?: string }): boolean =>
  !isServerId(it.id) &&
  (it.pending === true || it.status === 'ready' || it.status === 'failed' || hasPendingCreate(it.id));

/** Merge fetched meals with local-only items, re-appended into their slot.
 *  ponytail: an in-flight create that already landed in the fetched snapshot can
 *  briefly duplicate until its id swap; dedupe-on-swap if it ever shows up. */
function mergeMeals(server: StoredMeal[], prev: StoredMeal[]): StoredMeal[] {
  const keepBySlot = new Map<StoredMeal['slot'], StoredFoodItem[]>();
  for (const m of prev) {
    const keep = m.items.filter(keepAcrossHydration);
    if (keep.length > 0) keepBySlot.set(m.slot, keep);
  }
  if (keepBySlot.size === 0) return server;
  const retotal = (m: StoredMeal): StoredMeal => ({
    ...m,
    calories: m.items.reduce((a, it) => a + it.calories, 0),
    protein: m.items.reduce((a, it) => a + it.protein, 0),
    carbs: m.items.reduce((a, it) => a + it.carbs, 0),
    fat: m.items.reduce((a, it) => a + it.fat, 0),
  });
  const merged = server.map((m) => {
    const extra = keepBySlot.get(m.slot);
    if (!extra) return m;
    keepBySlot.delete(m.slot);
    return retotal({ ...m, items: [...m.items, ...extra] });
  });
  for (const [slot, items] of keepBySlot) {
    const shell = prev.find((m) => m.slot === slot);
    if (shell) merged.push(retotal({ ...shell, items }));
  }
  return merged;
}

// Module-level hydrators (stable identities for useHydration's deps).
export async function hydrateFoodLog(): Promise<void> {
  const rows = await api.foodLogs.list({ date: todayISO() });
  useFoodStore.setState((s) => ({ meals: mergeMeals(mealsFromLogs(rows), s.meals) }));
}
async function hydrateSavedFoods(): Promise<void> {
  const rows = await api.savedFoods.list();
  useFoodStore.setState((s) => ({
    savedFoods: [...s.savedFoods.filter(keepAcrossHydration), ...rows.map(savedFoodFromApi)],
  }));
}
async function hydrateGym(): Promise<void> {
  // Sessions and streak hydrate together; the mock 30-day calendar stays local
  // (no server representation yet).
  const [sessions, streak] = await Promise.all([api.gym.listSessions(), api.gym.streak()]);
  useGymStore.setState((s) => ({ sessions: sessionsFromApi(sessions), streak: streakFromApi(streak, s.streak) }));
}

// --- Food log ---------------------------------------------------------------

export function useFoodLog(): Async<StoredMeal[]> {
  const data = useFoodStore((s) => s.meals);
  const { isLoading, error, refetch } = useHydration(hydrateFoodLog);
  return { data, isLoading, error, refetch };
}

export function useMeal(mealId: string | undefined): StoredMeal | undefined {
  return useFoodStore((s) => s.meals.find((m) => m.id === mealId));
}

export function useSavedFoods(): Async<ReturnType<typeof selectSaved>> {
  const data = useFoodStore(selectSaved);
  const { isLoading, error, refetch } = useHydration(hydrateSavedFoods);
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
  const { isLoading, error, refetch } = useHydration(hydrateGym);
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

// (useSubscription was deleted in the Phase 14 audit: the subscription screen
// now reads entitlement truthfully from the billing seam instead of rendering
// the mock as if it were the user's real plan.)

