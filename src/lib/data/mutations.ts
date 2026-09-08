// Mutations — imperative writes through the data seam, mirroring React Query's
// `mutate`. Each performs the optimistic local store update first (the app must
// keep working with no backend), then fires the corresponding API call in the
// background; failures are logged and the local state stands.
import { api, type GymExerciseInput } from '@/lib/api';
import { track } from '@/lib/analytics';
import { runOrQueue, runOrQueueSequence } from '@/lib/offline/queue';
import { isServerId, logInputFromItem, logPatchFromItem, savedInputFromApp, todayISO } from './mappers';
import { useFoodStore, type NewFoodItem } from './foodStore';
import { useGymStore } from './gymStore';
import type { EntryMethod, MealSlot, SavedFood } from '@/lib/mock/data';

const food = () => useFoodStore.getState();
const gym = () => useGymStore.getState();

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

const trackCreate = (pending: Map<string, Promise<string | null>>, localId: string, create: Promise<string | null>) =>
  pending.set(
    localId,
    create.catch((e: unknown) => {
      if (__DEV__) console.warn('[data] background sync failed:', e instanceof Error ? e.message : e);
      return null;
    }),
  );

/** Register a meal-item create round-trip: swaps the server id onto the local row
 *  on success and lets racing edits/deletes await it. Also used by scan.ts for
 *  the confirm call — its failure only warns and never propagates to the caller.
 *  A null row means "queued for replay" (see logMeal): the local id stands until
 *  the flush lands, and hydration keeps the row because hasPendingCreate is true. */
export const registerMealCreate = (localId: string, create: Promise<{ id: string } | null>) =>
  trackCreate(
    pendingMealCreates,
    localId,
    create.then((row) => {
      if (!row) return null;
      swapMealItemId(localId, row.id);
      return row.id;
    }),
  );

/** True while (or after) a create for this local id is being synced — hydration
 *  keeps these rows since the server list can't include them yet. */
export const hasPendingCreate = (id: string): boolean => pendingMealCreates.has(id) || pendingSavedCreates.has(id);

/** Run `op` against the row's server id: directly for server ids, after the
 *  in-flight create resolves for local ids. Skipped (with a warn) when the
 *  create failed OR was queued — there is no server row to address yet.
 *
 *  ponytail: an edit made between a queued create and its flush is therefore
 *  local-only — the replay posts the ORIGINAL body. (Still strictly better than
 *  before, when the whole row never reached the server.) Give the queue a
 *  "patch a pending body" call if users report edited portions reverting. */
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
export const logMeal = (
  slot: MealSlot,
  item: NewFoodItem,
  method: EntryMethod = 'manual',
  pending = false,
  // Which day to log against. Defaults to the day the food UI is showing, so
  // logging while browsing a past day lands on that day, not on today.
  date?: string,
): string => {
  const day = date ?? food().selectedDate;
  const id = food().logMeal(slot, item, method, pending, day);
  // Pending rows are scan placeholders — the scan confirm endpoint persists those
  // (and emit scan_* analytics instead of food_logged).
  if (!pending) {
    track('food_logged', { method });
    // Through the offline queue, NOT api.foodLogs.create directly: the food store
    // has no cross-restart persistence, so a write the backend refuses (offline,
    // 5xx from a proxy/restarting server, 429) would otherwise exist only in this
    // session and be gone at next launch. Queued it carries an Idempotency-Key,
    // so the replay can never produce a second row; onLanded swaps the server id
    // onto the optimistic row when it finally goes through.
    registerMealCreate(
      id,
      runOrQueue<{ id: string }>('/api/food/logs', logInputFromItem(slot, item, method, day), (row) =>
        swapMealItemId(id, row.id),
      ),
    );
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
/** The rest of a logged workout: the exercises to attach and the adherence rate.
 *  Given → the session is logged as create → exercises → complete, one unit. */
export type GymWorkout = { name?: string; exercises?: GymExerciseInput[]; completionRate?: number };

export const logGymSession = (
  session?: Parameters<ReturnType<typeof useGymStore.getState>['logGymSession']>[0],
  workout?: GymWorkout,
) => {
  // The dashboard quick-log is a once-a-day toggle: if today is already
  // logged the store would no-op, so skip the server round-trip too rather
  // than create a duplicate row. A FULL workout (workout given — the user just
  // finished a scheduled session) always writes: silently discarding the
  // exercises someone just performed is worse than a second session row.
  if (!workout && gym().streak.gymLoggedToday) return;
  gym().logGymSession(session);
  track('workout_logged');
  // GymSessionInput has no effort/energy field (backend session row is
  // date/name/notes/duration only) — both stay device-local on the store session.
  // The whole create → exercises → complete sequence goes through the offline
  // queue as ONE unit with one idempotency key: offline it is replayed in order
  // on reconnect, and a replay can never produce a second session.
  sync(
    runOrQueueSequence(
      '/api/gym/sessions',
      { date: todayISO(), name: workout?.name, duration_minutes: session?.durationMin, notes: session?.notes },
      workout
        ? [
            ...(workout.exercises ?? []).map((e) => ({ path: '/api/gym/sessions/{id}/exercises', body: e })),
            { path: '/api/gym/sessions/{id}/complete', body: { completion_rate: workout.completionRate } },
          ]
        : [],
    ),
  );
};

export const applyFreeze = (offsetDays = 0) => {
  if (gym().streak.freezesAvailable <= 0) return;
  gym().applyFreeze(offsetDays);
  sync(api.gym.freeze());
};

