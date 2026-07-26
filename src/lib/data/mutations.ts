// Mutations — imperative writes through the data seam, mirroring React Query's
// `mutate`. Each performs the optimistic local store update first (the app must
// keep working with no backend), then fires the corresponding API call in the
// background; failures are logged and the local state stands.
import { api } from '@/lib/api';
import { isServerId, logInputFromItem, logPatchFromItem, savedInputFromApp, todayISO } from './mappers';
import { useFoodStore, type NewFoodItem } from './foodStore';
import { useGymStore } from './gymStore';
import { useUserStore, type UserProfile } from './userStore';
import { useSettingsStore, type MacroGoals } from '@/lib/settings/store';
import type { EntryMethod, MealSlot, SavedFood } from '@/lib/mock/data';

const food = () => useFoodStore.getState();
const gym = () => useGymStore.getState();
const settings = () => useSettingsStore.getState();

/** Background sync: local state already updated; API failure is non-fatal. */
const sync = (p: Promise<unknown>) =>
  p.catch((e: unknown) => {
    if (__DEV__) console.warn('[data] background sync failed:', e instanceof Error ? e.message : e);
  });

// After a successful create, swap the optimistic local id for the server row id
// so later edits/deletes address the real row.
const swapMealItemId = (localId: string, serverId: string) =>
  useFoodStore.setState((s) => ({
    meals: s.meals.map((m) =>
      m.items.some((it) => it.id === localId)
        ? { ...m, items: m.items.map((it) => (it.id === localId ? { ...it, id: serverId } : it)) }
        : m,
    ),
  }));

const swapSavedId = (localId: string, serverId: string) =>
  useFoodStore.setState((s) => ({
    savedFoods: s.savedFoods.map((f) => (f.id === localId ? { ...f, id: serverId } : f)),
  }));

// In-flight creates, keyed by local id. Edits/deletes racing the create's server
// round-trip await the promise and target the resolved server id instead of being
// dropped; hydration (hooks.ts) uses the map to keep unsynced rows across a fetch.
// The stored promise never rejects — it resolves null when the create failed.
// ponytail: entries are kept for the whole session (stale-closure ops still resolve); memory is trivial.
const pendingMealCreates = new Map<string, Promise<string | null>>();
const pendingSavedCreates = new Map<string, Promise<string | null>>();

const trackCreate = (pending: Map<string, Promise<string | null>>, localId: string, create: Promise<string>) =>
  pending.set(
    localId,
    create.catch((e: unknown) => {
      if (__DEV__) console.warn('[data] background sync failed:', e instanceof Error ? e.message : e);
      return null;
    }),
  );

/** Register a meal-item create round-trip: swaps the server id onto the local row
 *  on success and lets racing edits/deletes await it. Also used by scan.ts for
 *  the confirm call — its failure only warns and never propagates to the caller. */
export const registerMealCreate = (localId: string, create: Promise<{ id: string }>) =>
  trackCreate(
    pendingMealCreates,
    localId,
    create.then((row) => {
      swapMealItemId(localId, row.id);
      return row.id;
    }),
  );

/** True while (or after) a create for this local id is being synced — hydration
 *  keeps these rows since the server list can't include them yet. */
export const hasPendingCreate = (id: string): boolean => pendingMealCreates.has(id) || pendingSavedCreates.has(id);

/** Run `op` against the row's server id: directly for server ids, after the
 *  in-flight create resolves for local ids. Skipped (with a warn) when the
 *  create failed — there is no server row to address. */
const withServerId = (pending: Map<string, Promise<string | null>>, id: string, op: (serverId: string) => Promise<unknown>) => {
  const inFlight = pending.get(id);
  if (inFlight) {
    sync(
      inFlight.then((serverId) => {
        if (serverId) return op(serverId);
        if (__DEV__) console.warn('[data] create never synced; skipping server op for', id);
      }),
    );
  } else if (isServerId(id)) {
    sync(op(id));
  }
};

// --- Food log ---
export const logMeal = (slot: MealSlot, item: NewFoodItem, method: EntryMethod = 'manual', pending = false): string => {
  const id = food().logMeal(slot, item, method, pending);
  // Pending rows are scan placeholders — the scan confirm endpoint persists those.
  if (!pending) {
    registerMealCreate(id, api.foodLogs.create(logInputFromItem(slot, item, method)));
  }
  return id;
};

export const editFoodItem = (itemId: string, patch: Partial<NewFoodItem>) => {
  food().editFoodItem(itemId, patch);
  withServerId(pendingMealCreates, itemId, (serverId) => api.foodLogs.update(serverId, logPatchFromItem(patch)));
};

export const deleteFoodItem = (itemId: string) => {
  food().deleteFoodItem(itemId);
  withServerId(pendingMealCreates, itemId, (serverId) => api.foodLogs.delete(serverId));
};

// --- Saved foods ---
export const saveFood = (f: Omit<SavedFood, 'id'>) => {
  const id = food().saveFood(f);
  trackCreate(
    pendingSavedCreates,
    id,
    api.savedFoods.create(savedInputFromApp(f)).then((row) => {
      swapSavedId(id, row.id);
      return row.id;
    }),
  );
};

// Local-only: the backend has no saved-food update endpoint (only list/create/delete).
export const editSavedFood = (id: string, patch: Partial<SavedFood>) => food().editSavedFood(id, patch);

export const unsaveFood = (id: string) => {
  food().unsaveFood(id);
  withServerId(pendingSavedCreates, id, (serverId) => api.savedFoods.delete(serverId));
};

// --- Gym ---
export const logGymSession = (session?: Parameters<ReturnType<typeof useGymStore.getState>['logGymSession']>[0]) => {
  if (gym().streak.gymLoggedToday) return; // store would no-op; don't create a duplicate server row
  gym().logGymSession(session);
  sync(
    api.gym.createSession({
      date: todayISO(),
      duration_minutes: session?.durationMin,
      notes: session?.notes,
    }),
  );
};

export const applyFreeze = () => {
  if (gym().streak.freezesAvailable <= 0) return;
  gym().applyFreeze();
  sync(api.gym.freeze());
};

// --- Goals ---
/** Switch to custom goals and patch them (used by the Goals editor). */
export const setGoals = (patch: Partial<MacroGoals>) => {
  settings().setGoalMode('custom');
  settings().setCustomGoals(patch);
  const g = settings().customGoals; // full, post-patch goals — PUT the whole document
  sync(
    api.goals.put({
      calorie_target: g.calories,
      protein_target: g.protein,
      carb_target: g.carbs,
      fat_target: g.fat,
      fibre_target: g.fibre,
      source: 'custom',
    }),
  );
};

// --- User profile (onboarding bridge writes here; server sync lands with Clerk) ---
export const setUserProfile = (patch: Partial<UserProfile>) => useUserStore.getState().setProfile(patch);
