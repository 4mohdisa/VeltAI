// Data-access hooks — the ONE seam between screens and data. Reads are reactive
// (zustand stores as the cache); on mount each wired hook attempts the real API
// fetch and hydrates its store on success. On failure (backend down / not signed
// in) the store keeps whatever it already holds — no crash — and the hook reports
// a real `error`, so a screen can label that data as not current instead of
// passing it off as fresh. Writes are imperative mutation functions (./mutations + ./scan)
// that update the store optimistically and fire the API call in the background.
import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, type Onboarding } from '@/lib/api';
import { isServerId, mealsFromLogs, savedFoodFromApi, sessionsFromApi, streakFromApi } from './mappers';
import { hasPendingCreate } from './mutations';
import { fibreTotal } from './summaryCards';
import { countsInTotals, useFoodStore, type StoredFoodItem, type StoredMeal } from './foodStore';
import { useGymStore, type LoggedDay, type Streak } from './gymStore';
import { useUserStore, type UserProfile } from './userStore';
import { useEffectiveGoals, type MacroGoals } from '@/lib/settings/store';
import { isDevBuild } from '@/lib/env';
import {
  foodCatalog,
  mockPlan,
  mockPlanReason,
  mockUpcomingDays, type FoodResult,
  type GymSession,
  type MacroKey,
  type UpcomingDay,
} from '@/lib/mock/data';

export type Async<T> = { data: T; isLoading: boolean; error: Error | null; refetch: () => void };

/** Real-fetch shim — on mount, attempt the API and hydrate the store.
 *
 *  A failure used to be INVISIBLE: `error` stayed null by design and the screen
 *  silently kept whatever the store already held — the mock seed in dev, stale or
 *  empty values in release — so "we could not reach the server" looked exactly
 *  like "here is your data". Callers now receive the real Error and say so in
 *  their own words; nothing here invents a reason, because the fetch layer
 *  supplies none the user could act on.
 *
 *  The store is still hydrated-on-success and left alone on failure, so a screen
 *  that wants to keep showing what the device already has (the offline
 *  experience) still can — it just has to label it rather than pass it off as
 *  current.
 */
function useHydration(hydrate: () => Promise<void>): { isLoading: boolean; error: Error | null; refetch: () => void } {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // `alive` is read at settle time so an unmounted screen never sets state.
  const run = useCallback(
    (alive: () => boolean) =>
      hydrate()
        .then(() => {
          if (alive()) setError(null); // a later success clears an earlier failure
        })
        .catch((e: unknown) => {
          if (__DEV__) console.warn('[data] API unreachable, keeping local data:', e instanceof Error ? e.message : e);
          // Never rendered — screens write their own copy. It exists so the
          // caller can tell "failed" from "fine", which is the whole point.
          if (alive()) setError(e instanceof Error ? e : new Error('hydration failed'));
        })
        .finally(() => {
          if (alive()) setIsLoading(false);
        }),
    [hydrate],
  );
  const refetch = useCallback(() => {
    setIsLoading(true);
    void run(() => true);
  }, [run]);
  useEffect(() => {
    let alive = true;
    void run(() => alive);
    return () => {
      alive = false;
    };
  }, [run]);
  return { isLoading, error, refetch };
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
  // Sessions and streak hydrate together. The Gym month calendar reads its own
  // month of sessions (useGymMonth), so nothing calendar-shaped is stored here.
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
              fibre: r.fibre,
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
      // Real now: items carry fibre when the source that produced them had one
      // (Open Food Facts / USDA / a typed label). Items from a source without
      // fibre contribute nothing rather than a 0 — useFibreConsumed() below is
      // what tells a caller whether ANY of today's food knows its fibre.
      fibre: { consumed: fibreTotal(meals).consumed, target: goals.fibre },
    };
  }, [meals, goals]);
}

/** Today's fibre, or null when nothing logged today carries a fibre figure.
 *  Summary shows "Not tracked" for the null case instead of a bare 0 g. */
export function useFibreConsumed(): number | null {
  const meals = useFoodStore((s) => s.meals);
  return useMemo(() => {
    const { consumed, known } = fibreTotal(meals);
    return known ? consumed : null;
  }, [meals]);
}

// --- Gym --------------------------------------------------------------------

export type GymData = {
  streak: Streak;
  /** Days trained / frozen on this device, by date (V7 — the calendar itself is
   *  built from server sessions by useGymMonth + monthView). */
  loggedDays: LoggedDay[];
  frozenDates: string[];
  sessions: GymSession[];
  upcoming: UpcomingDay[];
};

export function useGym(): Async<GymData> {
  const streak = useGymStore((s) => s.streak);
  const loggedDays = useGymStore((s) => s.loggedDays);
  const frozenDates = useGymStore((s) => s.frozenDates);
  const sessions = useGymStore((s) => s.sessions);
  const { isLoading, error, refetch } = useHydration(hydrateGym);
  // mockUpcomingDays is a fixed list with literal past dates ('Wed 18 Jun') and
  // invented freeze/scheduled actions, and gym/streak.tsx makes those rows
  // actionable — applying a freeze to an invented day. Dev only.
  const upcoming = isDevBuild() ? mockUpcomingDays : [];
  return { data: { streak, loggedDays, frozenDates, sessions, upcoming }, isLoading, error, refetch };
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

/** Everything Summary reads that another screen owns. allSettled, so one
 *  unreachable endpoint cannot stop the others from landing — but the result is
 *  then INSPECTED, because a promise that always resolves would report every
 *  outage as success and put Summary straight back to showing seeded values as
 *  current.
 *
 *  The profile read is deliberately not fatal: the avatar already falls back to a
 *  glyph when there is no name, which is honest on its own. The food and gym
 *  reads are the streak and the macros, so either failing means Summary cannot
 *  claim its numbers are current.
 *
 *  ponytail: ONE error for both sources, so a food-only outage also labels the
 *  streak. Split it per source if that coarseness ever misleads. */
async function hydrateDashboard(): Promise<void> {
  const [food, gym] = await Promise.allSettled([hydrateFoodLog(), hydrateGym(), hydrateProfile()]);
  const failed = [food, gym].find((r) => r.status === 'rejected');
  if (failed?.status === 'rejected') {
    throw failed.reason instanceof Error ? failed.reason : new Error('hydration failed');
  }
}

/**
 * Summary's data. It reads the gym store (streak) and the food store (macros),
 * which the Gym and Food tabs own — and it used to rely on one of those tabs
 * having run first: its `isLoading` was a 600ms cosmetic timer and the only real
 * fetch was pull-to-refresh. So a cold launch that stayed on Summary showed the
 * SEEDED streak and macros as though they were current, forever (13 days in dev,
 * 0 in a release build). It now hydrates on its own mount, like every other tab,
 * and `isLoading` is true until those reads actually settle so the screen can say
 * "loading" instead of showing a seed as fact.
 *
 * ponytail: no cache/staleness layer, deliberately — useHydration has none for
 * any other screen either, so visiting Gym or Food after this still refetches
 * exactly as it did before. Add one in useHydration for everyone if it matters.
 */
export function useDashboard() {
  const profile = useUserStore((s) => s.profile);
  const streak = useGymStore((s) => s.streak);
  const macros = useDailyMacros();
  const { isLoading, error, refetch } = useHydration(hydrateDashboard);
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

