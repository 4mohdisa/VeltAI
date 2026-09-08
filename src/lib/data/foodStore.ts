// In-session food store (Task 1b) — the mutable source of truth for the food log
// and saved foods, seeded once from the centralized mock. Edits made here survive
// navigation between tabs within a session (no cross-restart persistence — that's
// the backend). The data-access hooks (./hooks) read/write this store; screens
// never touch mock directly.
//
// DATE-AWARE (architecture item 3). The store used to hold exactly one day —
// today — and every write stamped today implicitly. It now keys rows by ISO date
// in `byDate`, tracks which day the UI is showing in `selectedDate`, and takes an
// explicit target date on every write.
//
// `meals` survives as the rows for `selectedDate`, mirrored from `byDate` by the
// single `commit()` helper below. That is deliberate: dozens of call sites and
// several tests read `state.meals` meaning "the day on screen", and with the
// default selection (today) it means exactly what it always did.
//
// Item mutations address a row by id ACROSS EVERY cached day, not just the
// visible one. A scan started on Tuesday must still resolve onto Tuesday's row
// after the user swipes to Wednesday — scoping mutations to the visible day would
// silently drop the result.
import { create } from 'zustand';

import {
  mockMeals,
  mockSavedFoods,
  type EntryMethod,
  type FoodItem,
  type Meal,
  type MealSlot,
  type SavedFood,
} from '@/lib/mock/data';
import type { ScanItemStatus } from '@/lib/types';
import type { ScanConfidenceFactor } from '@/lib/api';
import { isDevBuild } from '@/lib/env';

// Items carry a stable id so edits/deletes/pending-scan resolution address a row
// directly (mock items are id-less; ids are assigned when seeding the store).
// The scan-review fields are additive + optional: `status` drives which card
// variant a scanned row renders (analyzing → ready → confirmed/failed);
// `estimatedWeightG` is the AI's original weight guess (the slider baseline);
// `scanSessionId` links back to /confirm, /correction, /feedback. `confidence`
// already lives on FoodItem (0..1).
export type StoredFoodItem = FoodItem & {
  id: string;
  pending?: boolean;
  status?: ScanItemStatus;
  scanSessionId?: string;
  // The server food_logs row behind a scan review card. Local rows learn it
  // when the pipeline responds; hydrated rows carry it as their own id. It is
  // what discard deletes — without it a discarded scan's server row survived
  // and resurrected as a review card on the next refresh (audit 2026-08-06).
  serverLogId?: string;
  estimatedWeightG?: number;
  // Multi-angle capture (Phase 13): how well the angles agreed (0..1), whether
  // the user must pick between disagreeing estimates, the explanation, and the
  // alternate total weight from the other angle(s).
  angleAgreement?: number;
  needsConfirmation?: boolean;
  reconciliationNote?: string;
  alternateWeightG?: number;
  // Repeat-meal match (signal 5): "looks like your usual X — 450 g?".
  matchedMealName?: string;
  matchedMealWeightG?: number;
  // The server's OWN confidence verdict, carried verbatim so the review card
  // shows what the pipeline computed rather than re-deriving it. `confidence`
  // above is the same score as a 0..1 scalar; these two are the band label
  // ('High'|'Medium'|'Low') and the signed factors behind it.
  confidenceLabel?: string;
  confidenceFactors?: ScanConfidenceFactor[];
};
export type StoredMeal = Omit<Meal, 'items'> & { items: StoredFoodItem[] };

/** Patch for a scanned row under review — name/weight/macros/status plus the
 *  ready-transition metadata (confidence/session/estimate weight). */
export type ScannedItemPatch = Partial<
  Pick<
    StoredFoodItem,
    | 'name'
    | 'quantityG'
    | 'calories'
    | 'protein'
    | 'carbs'
    | 'fat'
    | 'status'
    | 'confidence'
    | 'scanSessionId'
    | 'serverLogId'
    | 'estimatedWeightG'
    | 'angleAgreement'
    | 'needsConfirmation'
    | 'reconciliationNote'
    | 'alternateWeightG'
    | 'matchedMealName'
    | 'matchedMealWeightG'
    | 'confidenceLabel'
    | 'confidenceFactors'
  >
>;

let counter = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

/** The DEVICE-local calendar date as YYYY-MM-DD. Duplicated from ./mappers
 *  rather than imported: mappers imports this module's types, and the cycle
 *  breaks the node test environment. Same implementation, same contract. */
function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const seedSaved = (): SavedFood[] => (isDevBuild() ? mockSavedFoods.map((f) => ({ ...f })) : []);

function seedMeals(): StoredMeal[] {
  // A RELEASE build starts EMPTY. Seeding fabricated meals meant a real user
  // whose backend was unreachable saw logs they never made (a 520 kcal 07:10
  // "photo" breakfast) presented as their own — App Store 2.1, and the third
  // instance of that failure class in this codebase. Dev keeps the seed so the
  // keyless offline experience stays navigable.
  if (!isDevBuild()) return [];
  // Recompute meal totals from items on seed so the food log (item sums) and the
  // dashboard/nutrition (meal totals) agree — the mock's meal.calories don't all
  // match their item sums.
  return mockMeals.map((m) =>
    recompute({
      ...m,
      items: m.items.map((it) => ({ ...it, id: nextId('it') })),
    }),
  );
}

/** The dev seed belongs to today; every other day starts genuinely empty rather
 *  than showing today's meals again under a different date. */
function seedByDate(): Record<string, StoredMeal[]> {
  const meals = seedMeals();
  return meals.length > 0 ? { [localToday()]: meals } : {};
}

// Under-review ('ready') and 'failed' scan rows aren't logged yet, so they
// don't count toward meal totals (which feed the food log + dashboard).
// They become countable the moment saveScannedItem flips them to 'confirmed'.
// 'analyzing' is deliberately NOT excluded: a placeholder row carries zero
// macros on both sides (CreateAnalyzingLog inserts 0s), so excluding it
// would change nothing except hide the optimistic row from its meal.
// Exported because hooks.ts mergeMeals must apply the SAME rule — it had its
// own retotal that counted every row, so a refresh mid-review inflated the
// day by the unconfirmed estimate (audit 2026-08-06).
export const countsInTotals = (it: { status?: ScanItemStatus }): boolean =>
  it.status !== 'ready' && it.status !== 'failed';

function recompute(meal: StoredMeal): StoredMeal {
  const sum = meal.items.reduce(
    (a, it) =>
      !countsInTotals(it)
        ? a
        : {
            calories: a.calories + it.calories,
            protein: a.protein + it.protein,
            carbs: a.carbs + it.carbs,
            fat: a.fat + it.fat,
          },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return { ...meal, ...sum };
}

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export type NewFoodItem = Omit<FoodItem, 'confidence'> & { confidence?: number };

type FoodState = {
  /** The day the UI is showing, ISO YYYY-MM-DD. Defaults to today. */
  selectedDate: string;
  /** Rows for `selectedDate` — a mirror of byDate[selectedDate], never edited
   *  directly. Read it anywhere you mean "the day on screen". */
  meals: StoredMeal[];
  /** Every day fetched or written this session, keyed by ISO date. */
  byDate: Record<string, StoredMeal[]>;
  savedFoods: SavedFood[];

  // --- day selection ---
  /** Show a different day. Cached days appear instantly; an unfetched day is
   *  empty until its hydration lands. */
  setSelectedDate: (date: string) => void;
  /** Replace one day's rows wholesale (used by hydration). */
  setDayMeals: (date: string, meals: StoredMeal[]) => void;

  // --- meal item mutations ---
  /** Log a food item to a slot on `date` (default: the selected day); creates
   *  the meal if that slot has none yet. Returns the new item id (for
   *  pending-scan resolution). */
  logMeal: (slot: MealSlot, item: NewFoodItem, method: EntryMethod, pending?: boolean, date?: string) => string;
  editFoodItem: (itemId: string, patch: Partial<FoodItem>) => void;
  deleteFoodItem: (itemId: string) => void;
  resolvePending: (itemId: string, item: NewFoodItem) => void;

  // --- scan review lifecycle ---
  /** Flip just the review status of a scanned row (analyzing→ready→confirmed/failed). */
  setItemStatus: (itemId: string, status: ScanItemStatus) => void;
  /** Patch a scanned row's fields (name/weight/macros/status + ready metadata). */
  updateScannedItem: (itemId: string, patch: ScannedItemPatch) => void;

  // --- saved foods ---
  /** Save a food; returns the new local id (for server-id reconciliation). */
  saveFood: (food: Omit<SavedFood, 'id'>) => string;
  editSavedFood: (id: string, patch: Partial<SavedFood>) => void;
  unsaveFood: (id: string) => void;

  /** Sign-out: back to the seeded initial state (no user data retained). */
  reset: () => void;
};

/** Write a new day map and re-mirror the visible day from it. Every mutation
 *  goes through here so `meals` can never drift from `byDate`. */
function commit(state: { selectedDate: string }, byDate: Record<string, StoredMeal[]>) {
  return { byDate, meals: byDate[state.selectedDate] ?? [] };
}

/** Apply `fn` to whichever day holds `itemId`. A row is addressed by id alone,
 *  so an in-flight scan resolves onto its own day even after the user moves on. */
function mapDayWithItem(
  byDate: Record<string, StoredMeal[]>,
  itemId: string,
  fn: (meals: StoredMeal[]) => StoredMeal[],
): Record<string, StoredMeal[]> {
  const next: Record<string, StoredMeal[]> = {};
  for (const [date, meals] of Object.entries(byDate)) {
    next[date] = meals.some((m) => m.items.some((it) => it.id === itemId)) ? fn(meals) : meals;
  }
  return next;
}

export const useFoodStore = create<FoodState>((set) => {
  const initial = seedByDate();
  const today = localToday();
  return {
    selectedDate: today,
    byDate: initial,
    meals: initial[today] ?? [],
    savedFoods: seedSaved(),
    reset: () => {
      const fresh = seedByDate();
      const day = localToday();
      return set({ selectedDate: day, byDate: fresh, meals: fresh[day] ?? [], savedFoods: seedSaved() });
    },

    setSelectedDate: (date) =>
      set((s) => ({ selectedDate: date, meals: s.byDate[date] ?? [] })),

    setDayMeals: (date, meals) =>
      set((s) => commit(s, { ...s.byDate, [date]: meals })),

    logMeal: (slot, item, method, pending = false, date) => {
      const id = nextId('it');
      set((s) => {
        // An explicit date wins; otherwise the row lands on the day being shown.
        const day = date ?? s.selectedDate;
        const dayMeals = s.byDate[day] ?? [];
        const stored: StoredFoodItem = { id, pending, ...item, confidence: item.confidence };
        const idx = dayMeals.findIndex((m) => m.slot === slot);
        let next: StoredMeal[];
        if (idx >= 0) {
          next = dayMeals.map((m, i) => (i === idx ? recompute({ ...m, items: [...m.items, stored] }) : m));
        } else {
          next = [
            ...dayMeals,
            recompute({
              id: nextId('m'),
              slot,
              time: nowTime(),
              method,
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              items: [stored],
            }),
          ];
        }
        return commit(s, { ...s.byDate, [day]: next });
      });
      return id;
    },

    resolvePending: (itemId, item) =>
      set((s) =>
        commit(
          s,
          mapDayWithItem(s.byDate, itemId, (meals) =>
            meals.map((m) =>
              m.items.some((it) => it.id === itemId)
                ? recompute({
                    ...m,
                    items: m.items.map((it) => (it.id === itemId ? { ...it, ...item, pending: false } : it)),
                  })
                : m,
            ),
          ),
        ),
      ),

    editFoodItem: (itemId, patch) =>
      set((s) =>
        commit(
          s,
          mapDayWithItem(s.byDate, itemId, (meals) =>
            meals.map((m) =>
              m.items.some((it) => it.id === itemId)
                ? recompute({ ...m, items: m.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) })
                : m,
            ),
          ),
        ),
      ),

    setItemStatus: (itemId, status) =>
      set((s) =>
        commit(
          s,
          mapDayWithItem(s.byDate, itemId, (meals) =>
            meals.map((m) =>
              m.items.some((it) => it.id === itemId)
                ? recompute({ ...m, items: m.items.map((it) => (it.id === itemId ? { ...it, status } : it)) })
                : m,
            ),
          ),
        ),
      ),

    updateScannedItem: (itemId, patch) =>
      set((s) =>
        commit(
          s,
          mapDayWithItem(s.byDate, itemId, (meals) =>
            meals.map((m) =>
              m.items.some((it) => it.id === itemId)
                ? recompute({ ...m, items: m.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) })
                : m,
            ),
          ),
        ),
      ),

    deleteFoodItem: (itemId) =>
      set((s) =>
        commit(
          s,
          mapDayWithItem(s.byDate, itemId, (meals) =>
            meals
              .map((m) => recompute({ ...m, items: m.items.filter((it) => it.id !== itemId) }))
              .filter((m) => m.items.length > 0),
          ),
        ),
      ),

    saveFood: (food) => {
      const id = nextId('s');
      set((s) => ({ savedFoods: [{ id, ...food }, ...s.savedFoods] }));
      return id;
    },
    editSavedFood: (id, patch) =>
      set((s) => ({ savedFoods: s.savedFoods.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
    unsaveFood: (id) => set((s) => ({ savedFoods: s.savedFoods.filter((f) => f.id !== id) })),
  };
});

/** The day the food UI is currently showing — the default target for a write.
 *  Screens that call the API directly (quick add, label scan, saved meals,
 *  recipes) use this instead of "today" so a log lands on the day on screen. */
export const selectedFoodDate = (): string => useFoodStore.getState().selectedDate;
