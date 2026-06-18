// Scan mutations (Task 1 + Task 3) — the async seam for the AI/lookup paths. Today
// these resolve mock data after a delay; the backend swaps the body for the real
// Gemini scan / Open Food Facts call without touching screens.
import { logMeal } from './mutations';
import { useFoodStore } from './foodStore';
import { aiDetectedItems, type DetectedItem } from '@/lib/mock/ai';
import { exampleBarcodeProduct, lookupBarcode, type BarcodeProduct } from '@/lib/food/barcode';
import type { MealSlot } from '@/lib/mock/data';

const ANALYZE_MS = 1600;
const LOOKUP_MS = 900;

/** Meal slot inferred from the current time (capture-first logging). */
export function slotForNow(date = new Date()): MealSlot {
  const h = date.getHours();
  if (h < 11) return 'Breakfast';
  if (h < 15) return 'Lunch';
  if (h < 17) return 'Snacks';
  return 'Dinner';
}

const toItem = (d: DetectedItem) => ({
  name: d.name,
  quantityG: d.quantityG,
  calories: d.calories,
  protein: d.protein,
  carbs: d.carbs,
  fat: d.fat,
  confidence: d.confidence,
});

/**
 * Capture-first photo scan: immediately logs PENDING rows to today's slot (they
 * render as analyzing skeletons), then fills them in with the detected result
 * after a mock delay. Returns the slot it logged into.
 */
export function startPhotoScan(): MealSlot {
  const slot = slotForNow();
  // One pending placeholder per detected item — they show as skeleton rows.
  const ids = aiDetectedItems.map(() =>
    logMeal(slot, { name: 'Analyzing…', quantityG: 0, calories: 0, protein: 0, carbs: 0, fat: 0 }, 'photo', true),
  );
  setTimeout(() => {
    const resolve = useFoodStore.getState().resolvePending;
    aiDetectedItems.forEach((d, i) => resolve(ids[i], toItem(d)));
  }, ANALYZE_MS);
  return slot;
}

/** Barcode lookup with a brief loading window before the product resolves. */
export function lookupBarcodeAsync(code = '9300605000000'): Promise<BarcodeProduct | null> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const found = await lookupBarcode(code);
      resolve(found ?? null);
    }, LOOKUP_MS);
  });
}

export { exampleBarcodeProduct };
