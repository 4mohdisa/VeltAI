// The subject of the ONE food-detail sheet (`src/app/food/detail.tsx`).
//
// A STORE, not route params, for two reasons. A food name and its macros are
// personal data, and this repo never puts personal data in a query string. And
// the barcode case carries only a code — the sheet still has to run an async
// lookup — so params would buy nothing anyway.
import { create } from 'zustand';

import type { MealSlot } from '@/lib/mock/data';

/** The editable shape every subject collapses to once it is resolved. */
export type DetailItem = {
  id: string;
  name: string;
  quantityG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** What the sheet was opened on. `mode` selects the sheet's behaviour:
 *  - `search`  a manual-search hit. The catalog is kcal-only, so it carries no
 *              macros and the sheet does not pretend otherwise.
 *  - `barcode` a scanned code. The sheet does the product lookup itself.
 *  - `saved`   a dish in Saved foods (edit / un-save).
 *  - `logged`  a row already in the food log (edit / delete / save to my foods).
 *  - `review`  a scanned row still under review — rename only (the review card
 *              re-scales its own energy from the estimate, so editing macros
 *              here would fight it). */
export type DetailSubject =
  | { mode: 'search'; name: string; kcalPer100: number }
  | { mode: 'barcode'; code: string }
  | { mode: 'saved'; item: DetailItem }
  | { mode: 'logged'; item: DetailItem; slot?: MealSlot }
  | { mode: 'review'; item: DetailItem };

export type DetailMode = DetailSubject['mode'];

/** A logged row's own per-100 g basis — its values divided by its weight. The
 *  only honest basis it has: no catalog lookup, and no fibre (the log never
 *  stored any). Null for a row with no weight, e.g. a kcal-only quick add. */
export function basisOf(item: DetailItem): { calories: number; protein: number; carbs: number; fat: number } | null {
  if (!(item.quantityG > 0)) return null;
  const k = 100 / item.quantityG;
  return { calories: item.calories * k, protein: item.protein * k, carbs: item.carbs * k, fat: item.fat * k };
}

/** Serving presets around what was logged: half, as logged, one and a half, double. */
export const presetsFor = (grams: number): number[] =>
  grams > 0 ? [...new Set([0.5, 1, 1.5, 2].map((k) => Math.round(grams * k)))].filter((g) => g > 0) : [];

type DetailSubjectState = {
  subject: DetailSubject | null;
  openDetail: (subject: DetailSubject) => void;
  clearDetail: () => void;
};

export const useDetailSubject = create<DetailSubjectState>((set) => ({
  subject: null,
  openDetail: (subject) => set({ subject }),
  clearDetail: () => set({ subject: null }),
}));

/** Set the subject, then `router.push('/food/detail')`. Kept separate from the
 *  navigation so each call site names the route it opens. */
export const openFoodDetail = (subject: DetailSubject) => useDetailSubject.getState().openDetail(subject);
