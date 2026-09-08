// Data-access hooks — the ONE seam between screens and data. Reads are reactive
// (zustand stores as the cache); on mount each wired hook attempts the real API
// fetch and hydrates its store on success. On failure (backend down / not signed
// in) the mock-seeded store data IS the offline experience — no crash, error
// stays null. Writes are imperative mutation functions (see ./mutations + ./scan)
// that update the store optimistically and fire the API call in the background.
import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, type Onboarding } from '@/lib/api';
import { isServerId, mealsFromLogs, savedFoodFromApi, sessionsFromApi, streakFromApi } from './mappers';
import { hasPendingCreate } from './mutations';
import { countsInTotals, useFoodStore, type StoredFoodItem, type StoredMeal } from './foodStore';
import { useGymStore, type Streak } from './gymStore';
import { useUserStore, type UserProfile } from './userStore';
import { useEffectiveGoals, type MacroGoals } from '@/lib/settings/store';
import { isDevBuild } from '@/lib/env';
import {
  foodCatalog,
  mockPlan,
  mockPlanReason,
  mockUpcomingDays,
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
 *
 *  Dedupe (audit 2026-08-06): a kept local scan row and a fetched server row
 *  with the SAME scan_session_id are the same underlying food_log — pre-audit
 *  both rendered, so a refresh mid-review duplicated the review card and
 *  double-counted the estimate. The LOCAL copy wins (the poller and the
 *  save/discard handlers are keyed on its id); the server copy is dropped.
 *
 *  Totals use foodStore's countsInTotals — the old local retotal counted
 *  'ready'/'failed' rows the store's own recompute excludes, so the two
 *  disagreed about the same meal.
 */
function mergeMeals(server: StoredMeal[], prev: StoredMeal[]): StoredMeal[] {
  const keepBySlot = new Map<StoredMeal['slot'], StoredFoodItem[]>();
  const keptSessions = new Set<string>();
  for (const m of prev) {
    const keep = m.items.filter(keepAcrossHydration);
    if (keep.length > 0) {
      keepBySlot.set(m.slot, keep);
      for (const it of keep) if (it.scanSessionId) keptSessions.add(it.scanSessionId);
    }
  }
  if (keepBySlot.size === 0) return server;
  const retotal = (m: StoredMeal): StoredMeal => ({
    ...m,
    calories: m.items.reduce((a, it) => a + (countsInTotals(it) ? it.calories : 0), 0),
    protein: m.items.reduce((a, it) => a + (countsInTotals(it) ? it.protein : 0), 0),
    carbs: m.items.reduce((a, it) => a + (countsInTotals(it) ? it.carbs : 0), 0),
    fat: m.items.reduce((a, it) => a + (countsInTotals(it) ? it.fat : 0), 0),
  });
  const merged = server.map((m) => {
    const extra = keepBySlot.get(m.slot);
    const items = m.items.filter((it) => !it.scanSessionId || !keptSessions.has(it.scanSessionId));
    if (!extra) return retotal({ ...m, items });
    keepBySlot.delete(m.slot);
    return retotal({ ...m, items: [...items, ...extra] });
  });
  for (const [slot, items] of keepBySlot) {
    const shell = prev.find((m) => m.slot === slot);
    if (shell) merged.push(retotal({ ...shell, items }));
  }
  return merged;
}

// Module-level hydrators (stable identities for useHydration's deps).
/** Fetch one day's food log and merge it over what the store already holds for
 *  that day. Defaults to the day the UI is showing. Note the endpoint takes ONE
 *  exact date and no range (backend/internal/food/handlers.go), so a day is the
 *  smallest unit we can ask for. */
export async function hydrateFoodLog(date?: string): Promise<void> {
  const day = date ?? useFoodStore.getState().selectedDate;
  const rows = await api.foodLogs.list({ date: day });
  const merged = mergeMeals(mealsFromLogs(rows), useFoodStore.getState().byDate[day] ?? []);
  useFoodStore.getState().setDayMeals(day, merged);
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
  // Distinct logged days — the only total we can actually prove from server data.
  const totalGymDays = new Set(sessions.map((r) => r.date)).size;
  useGymStore.setState((s) => ({
    sessions: sessionsFromApi(sessions),
    streak: streakFromApi(streak, s.streak, totalGymDays),
  }));
}

// --- Food log ---------------------------------------------------------------

/** Stable empty array — returning a fresh [] from the selector would give
 *  zustand a new reference every render and loop. */
const NO_MEALS: StoredMeal[] = [];

/** The food log for one day. Omit `date` to follow the store's selected day,
 *  which is what the Food tab does. */
export function useFoodLog(date?: string): Async<StoredMeal[]> {
  const selected = useFoodStore((s) => s.selectedDate);
  const day = date ?? selected;
  const data = useFoodStore((s) => s.byDate[day] ?? NO_MEALS);
  const hydrate = useCallback(() => hydrateFoodLog(day), [day]);
  const { isLoading, error, refetch } = useHydration(hydrate);
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

const catalogMatches = (q: string): FoodResult[] =>
  foodCatalog.filter((r) => r.name.toLowerCase().includes(q) || r.brand?.toLowerCase().includes(q));

/**
 * Manual food search. This used to filter an 8-item literal array and never
 * touch the network, so a reviewer typing "chicken" got a plausible-looking
 * result out of fiction, and "recents" was the first three entries of that same
 * array presented as the user's own recent foods. It now queries the real
 * /api/food/search; dev falls back to the local catalog when the backend is
 * unreachable so the screen stays usable without keys.
 */
export type FoodSearchState = {
  results: FoodResult[];
  recents: FoodResult[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useFoodSearch(query: string): FoodSearchState {
  const [results, setResults] = useState<FoodResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);
  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const q = query.trim();
    let alive = true;
    // Everything, including the empty-query reset, happens on the timer rather
    // than synchronously in the effect body — a synchronous setState here
    // cascades a second render pass on every keystroke.
    const id = setTimeout(() => {
      if (!alive) return;
      if (!q) {
        setResults([]);
        setError(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      api.foodSearch
        .search(q)
        .then((rows) => {
          if (!alive) return;
          setResults(
            rows.map((r) => ({
              name: r.food_name,
              brand: r.brand || undefined,
              kcalPer100: r.calories,
              protein: r.protein,
              carbs: r.carbs,
              fat: r.fat,
            })),
          );
          setError(null);
        })
        .catch((e: unknown) => {
          if (!alive) return;
          if (isDevBuild()) {
            setResults(catalogMatches(q.toLowerCase()));
            setError(null);
            return;
          }
          setResults([]);
          setError(e instanceof Error ? e : new Error('Search failed'));
        })
        .finally(() => {
          if (alive) setIsLoading(false);
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [query, nonce]);

  // Recents are the user's OWN most recent logged items, not a canned list.
  const meals = useFoodStore((s) => s.meals);
  const recents = useMemo(() => {
    const seen = new Set<string>();
    const out: FoodResult[] = [];
    for (const m of [...meals].reverse()) {
      for (const it of [...m.items].reverse()) {
        const key = it.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const per100 = it.quantityG > 0 ? Math.round((it.calories / it.quantityG) * 100) : it.calories;
        out.push({ name: it.name, kcalPer100: per100 });
        if (out.length === 5) return out;
      }
    }
    return out;
  }, [meals]);

  return { results, recents, isLoading, error, refetch };
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
      // Fibre is not tracked per food item yet, so there is nothing real to
      // report. It used to return a constant 18 g, which told a user with an
      // empty log that they had eaten 18 g of fibre — and VoiceOver read it
      // out as fact. 0 until items carry fibre; the target still shows.
      fibre: { consumed: 0, target: goals.fibre },
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
  // mockUpcomingDays is a fixed list with literal past dates ('Wed 18 Jun') and
  // invented freeze/scheduled actions, and gym/streak.tsx makes those rows
  // actionable — applying a freeze to an invented day. Dev only.
  const upcoming = isDevBuild() ? mockUpcomingDays : [];
  return { data: { streak, calendar, sessions, upcoming }, isLoading, error, refetch };
}

// --- Goals + profile --------------------------------------------------------

export function useGoals(): MacroGoals {
  return useEffectiveGoals();
}

/** Hydrate the signed-in user's identity from the server. Nothing did this
 *  before the pre-submission audit, so the Account screen showed the seeded
 *  placeholder name and email as the user's own, permanently, even with a
 *  healthy backend. Identity comes from the verified token server-side, so
 *  whatever this returns is genuinely the caller's. */
export async function hydrateProfile(): Promise<void> {
  // Identity and body metrics live in different places server-side: the profile
  // row (from Clerk) and the onboarding row (the user's own answers). Both are
  // needed — the body metrics are what deriveGoals computes calorie and protein
  // targets from, and nothing wrote them into this store before, so every user
  // in a release build got the 1,200 kcal floor and 0 g protein.
  const [p, onb] = await Promise.all([api.profile.get(), api.onboarding.get().catch(() => null)]);
  useUserStore.getState().setProfile({
    name: p.display_name ?? '',
    email: p.email ?? '',
    avatarUri: p.avatar_url ?? undefined,
    ...bodyFromOnboarding(onb),
  });
}

/** Map the stored onboarding answers onto profile fields. Units are normalised
 *  server-side to cm/kg, but the row records what was sent, so convert here too
 *  rather than trusting one of the two to have done it. */
export function bodyFromOnboarding(onb: Onboarding | null): Partial<UserProfile> {
  if (!onb) return {};
  const out: Partial<UserProfile> = {};
  if (onb.weight != null) out.weightKg = onb.weight_unit === 'lb' ? onb.weight * 0.453592 : onb.weight;
  if (onb.height != null) out.heightCm = onb.height_unit === 'in' ? onb.height * 2.54 : onb.height;
  if (onb.age != null) out.age = onb.age;
  if (onb.sex === 'male' || onb.sex === 'female' || onb.sex === 'other') out.sex = onb.sex;
  if (onb.activity_level && ACTIVITY_LEVELS.has(onb.activity_level)) {
    out.activityLevel = onb.activity_level as UserProfile['activityLevel'];
  }
  if (onb.goal === 'lose' || onb.goal === 'muscle') out.goal = onb.goal;
  return out;
}

const ACTIVITY_LEVELS = new Set(['sedentary', 'light', 'moderate', 'very_active']);

export function useUserProfile(): UserProfile {
  const profile = useUserStore((s) => s.profile);
  // Fire-and-forget on mount: a failure leaves whatever is already there
  // (empty in a release build) rather than throwing — same degradation
  // contract as every other hook here.
  useHydration(hydrateProfile);
  return profile;
}

// --- Dashboard --------------------------------------------------------------

// The "AI plan" and its rationale are not computed by anything — mockPlanReason
// is a first-person claim about THIS user ("you hit the gym 3/4 days this week
// … your sleep is averaging 6.8h") for a metric Lume does not even collect.
// Shipping that as the user's own plan is App Store 2.1. Dev keeps it so the
// screens stay reviewable; release gets an empty plan and the empty state.
const planForBuild = () => (isDevBuild() ? mockPlan : []);
const planReasonForBuild = () => (isDevBuild() ? mockPlanReason : null);

export function useDashboard() {
  const profile = useUserStore((s) => s.profile);
  const streak = useGymStore((s) => s.streak);
  const macros = useDailyMacros();
  const { isLoading, error, refetch: restartSkeleton } = useInitialLoad(600);
  // Pull-to-refresh actually refetches (audit 2026-08-06): the old refetch was
  // ONLY the skeleton timer, so if launch-time hydration failed (offline at
  // launch) Home could never recover its data — only visiting Food/Gym could.
  const refetch = useCallback(() => {
    restartSkeleton();
    void Promise.allSettled([hydrateFoodLog(), hydrateGym(), hydrateProfile()]);
  }, [restartSkeleton]);
  return {
    data: { profile, streak, macros, plan: planForBuild(), planReason: planReasonForBuild() },
    isLoading,
    error,
    refetch,
  };
}

/** Today's plan. Empty outside dev until the server actually generates one. */
export function usePlan() {
  return { plan: planForBuild(), reason: planReasonForBuild() };
}

// (useSubscription was deleted in the Phase 14 audit: the subscription screen
// now reads entitlement truthfully from the billing seam instead of rendering
// the mock as if it were the user's real plan.)

