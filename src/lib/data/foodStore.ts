// In-session food store (Task 1b) — the mutable source of truth for the food log
// and saved foods, seeded once from the centralized mock. Edits made here survive
// navigation between tabs within a session (no cross-restart persistence — that's
// the backend). The data-access hooks (./hooks) read/write this store; screens
// never touch mock directly.
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

// Items carry a stable id so edits/deletes/pending-scan resolution address a row
// directly (mock items are id-less; ids are assigned when seeding the store).
export type StoredFoodItem = FoodItem & { id: string; pending?: boolean };
export type StoredMeal = Omit<Meal, 'items'> & { items: StoredFoodItem[] };

let counter = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`;

function seedMeals(): StoredMeal[] {
  return mockMeals.map((m) => ({
    ...m,
    items: m.items.map((it) => ({ ...it, id: nextId('it') })),
  }));
}

function recompute(meal: StoredMeal): StoredMeal {
  const sum = meal.items.reduce(
    (a, it) => ({
      calories: a.calories + it.calories,
      protein: a.protein + it.protein,
      carbs: a.carbs + it.carbs,
      fat: a.fat + it.fat,
    }),
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
  meals: StoredMeal[];
  savedFoods: SavedFood[];

  // --- meal item mutations ---
  /** Log a food item to a slot; creates the meal if the slot has none yet.
   *  Returns the new item id (for pending-scan resolution). */
  logMeal: (slot: MealSlot, item: NewFoodItem, method: EntryMethod, pending?: boolean) => string;
  editFoodItem: (itemId: string, patch: Partial<FoodItem>) => void;
  deleteFoodItem: (itemId: string) => void;
  resolvePending: (itemId: string, item: NewFoodItem) => void;

  // --- saved foods ---
  saveFood: (food: Omit<SavedFood, 'id'>) => void;
  editSavedFood: (id: string, patch: Partial<SavedFood>) => void;
  unsaveFood: (id: string) => void;
};

export const useFoodStore = create<FoodState>((set) => ({
  meals: seedMeals(),
  savedFoods: mockSavedFoods.map((f) => ({ ...f })),

  logMeal: (slot, item, method, pending = false) => {
    const id = nextId('it');
    set((s) => {
      const stored: StoredFoodItem = { id, pending, ...item, confidence: item.confidence };
      const idx = s.meals.findIndex((m) => m.slot === slot);
      let meals: StoredMeal[];
      if (idx >= 0) {
        meals = s.meals.map((m, i) => (i === idx ? recompute({ ...m, items: [...m.items, stored] }) : m));
      } else {
        const meal: StoredMeal = recompute({
          id: nextId('m'),
          slot,
          time: nowTime(),
          method,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          items: [stored],
        });
        meals = [...s.meals, meal];
      }
      return { meals };
    });
    return id;
  },

  resolvePending: (itemId, item) =>
    set((s) => ({
      meals: s.meals.map((m) =>
        m.items.some((it) => it.id === itemId)
          ? recompute({ ...m, items: m.items.map((it) => (it.id === itemId ? { ...it, ...item, pending: false } : it)) })
          : m,
      ),
    })),

  editFoodItem: (itemId, patch) =>
    set((s) => ({
      meals: s.meals.map((m) =>
        m.items.some((it) => it.id === itemId)
          ? recompute({ ...m, items: m.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) })
          : m,
      ),
    })),

  deleteFoodItem: (itemId) =>
    set((s) => ({
      meals: s.meals
        .map((m) => recompute({ ...m, items: m.items.filter((it) => it.id !== itemId) }))
        .filter((m) => m.items.length > 0),
    })),

  saveFood: (food) => set((s) => ({ savedFoods: [{ id: nextId('s'), ...food }, ...s.savedFoods] })),
  editSavedFood: (id, patch) =>
    set((s) => ({ savedFoods: s.savedFoods.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
  unsaveFood: (id) => set((s) => ({ savedFoods: s.savedFoods.filter((f) => f.id !== id) })),
}));
