// Scan mutations — the async seam for the AI/lookup paths. When an image is
// provided, the real backend scan (Gemini) runs and the confirmed result is
// persisted server-side; with no image, or when the backend is unreachable, the
// mock resolution is the offline experience (capture-first UX keeps working).
import { api, type FoodLog } from '@/lib/api';
import { deleteFoodItem, logMeal, registerMealCreate } from './mutations';
import { barcodeProductFromApi, todayISO } from './mappers';
import { useFoodStore, type StoredFoodItem } from './foodStore';
import { startScanPoller } from './scanPoller';
import { aiDetectedItems, type DetectedItem } from '@/lib/mock/ai';
import { exampleBarcodeProduct, lookupBarcode, type BarcodeProduct } from '@/lib/food/barcode';
import type { MealSlot } from '@/lib/mock/data';
import type { ScanFeedbackRating } from '@/lib/types';

// Active status pollers keyed by the LOCAL review-row id, so save/discard can
// cancel a still-running poll. Pollers also self-terminate on ready/failed/60s.
const activePollers = new Map<string, () => void>();

function stopPoller(localId: string): void {
  const stop = activePollers.get(localId);
  if (stop) {
    stop();
    activePollers.delete(localId);
  }
}

// The AI estimate captured when a scan lands in 'ready', keyed by local item id.
// saveScannedItem reads it to send the ORIGINAL side of a /correction (the store
// row holds the user's CORRECTED name/weight by then). Session-lived; entries are
// deleted on save/discard, and a missing entry just skips the correction call.
type ScanEstimate = {
  name: string;
  weightG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  macroSource: string;
  readyAt: number;
  slot: MealSlot;
};
const scanEstimates = new Map<string, ScanEstimate>();

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

const pendingPlaceholder = { name: 'Analyzing…', quantityG: 0, calories: 0, protein: 0, carbs: 0, fat: 0 };

/**
 * Capture-first photo scan: immediately logs a PENDING row to today's slot (it
 * renders as an analyzing skeleton). With `imageBase64` the ASYNC pipeline
 * (POST /api/scan/pipeline) runs: the row stays 'analyzing' while a poller
 * watches the server food_log, then flips to 'ready' for REVIEW (not
 * auto-confirmed — saveScannedItem confirms on the user's "Save all"). If the
 * pipeline is unavailable (503 = no GEMINI_API_KEY, or unreachable) it falls
 * back to the old synchronous /api/scan and confirms directly (no review),
 * preserving no-key behaviour. The mock path (no image — the camera doesn't
 * capture frames yet) keeps the offline experience working. Returns the slot.
 */
export function startPhotoScan(imageBase64?: string, mimeType = 'image/jpeg'): MealSlot {
  const slot = slotForNow();

  if (imageBase64) {
    const id = logMeal(slot, pendingPlaceholder, 'photo', true);
    api.scan
      .pipeline(imageBase64, mimeType)
      .then(({ log_id, scan_session_id }) => {
        // Row stays 'analyzing'; remember the session id, then poll for 'ready'.
        useFoodStore.getState().updateScannedItem(id, { scanSessionId: scan_session_id });
        const stop = startScanPoller(
          log_id,
          (log) => {
            activePollers.delete(id);
            updateFoodLogStatus(id, 'ready', log);
          },
          () => {
            activePollers.delete(id);
            updateFoodLogStatus(id, 'failed');
          },
        );
        activePollers.set(id, stop);
      })
      .catch((e: unknown) => {
        // Pipeline unavailable (503 no key / unreachable) → old sync endpoint.
        if (__DEV__) console.warn('[scan] pipeline unavailable, falling back to sync scan:', e instanceof Error ? e.message : e);
        fallbackSyncScan(id, slot, imageBase64, mimeType);
      });
    return slot;
  }

  // Mock path — one pending placeholder per detected item (skeleton rows).
  const ids = aiDetectedItems.map(() => logMeal(slot, pendingPlaceholder, 'photo', true));
  setTimeout(() => {
    const resolve = useFoodStore.getState().resolvePending;
    aiDetectedItems.forEach((d, i) => resolve(ids[i], toItem(d)));
  }, ANALYZE_MS);
  return slot;
}

/**
 * Multi-angle scan (Phase 13): 1–3 shots with angle hints. One shot delegates to
 * the single-image path; more go through the reconciling pipeline. Same pending
 * row + poller + fallback contract as startPhotoScan.
 */
export function startMultiPhotoScan(images: { image_base64: string; mime_type?: string; angle: 'top' | 'side' | 'oblique' }[]): MealSlot {
  if (images.length <= 1) {
    return startPhotoScan(images[0]?.image_base64, images[0]?.mime_type ?? 'image/jpeg');
  }
  const slot = slotForNow();
  const id = logMeal(slot, pendingPlaceholder, 'photo', true);
  api.scan
    .pipelineMulti(images)
    .then(({ log_id, scan_session_id }) => {
      useFoodStore.getState().updateScannedItem(id, { scanSessionId: scan_session_id });
      const stop = startScanPoller(
        log_id,
        (log) => {
          activePollers.delete(id);
          updateFoodLogStatus(id, 'ready', log);
        },
        () => {
          activePollers.delete(id);
          updateFoodLogStatus(id, 'failed');
        },
      );
      activePollers.set(id, stop);
    })
    .catch((e: unknown) => {
      // Multi endpoint unavailable → degrade to the single-image path with the
      // primary (top) shot; never lose the capture.
      if (__DEV__) console.warn('[scan] multi pipeline unavailable, falling back:', e instanceof Error ? e.message : e);
      const primary = images.find((im) => im.angle === 'top') ?? images[0];
      fallbackSyncScan(id, slot, primary.image_base64, primary.mime_type ?? 'image/jpeg');
    });
  return slot;
}

/**
 * Apply a scan status transition (driven by the poller) onto the local review
 * row. `localId` is the local store row (not the server log id). On 'ready' the
 * completed food_log fills the row and marks it for review, snapshotting the AI
 * estimate for a later /correction. On 'failed' the row surfaces the
 * ScanFailedCard.
 */
export function updateFoodLogStatus(localId: string, status: 'ready' | 'failed', log?: FoodLog | null): void {
  const store = useFoodStore.getState();
  if (status === 'ready' && log) {
    const qty = log.quantity ?? 0;
    const score = log.scan_results?.confidence?.score;
    store.resolvePending(localId, {
      name: log.food_name,
      quantityG: qty,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      confidence: typeof score === 'number' ? score / 100 : undefined, // row confidence is 0..1
    });
    // Multi-angle metadata (absent on single-shot scans). The alternate total
    // is the sum of the disagreeing angle's estimates, for the pick-one UI.
    const sr = log.scan_results;
    const altWeight = sr?.alternate_estimates?.reduce((a, e) => a + (e.weight_g ?? 0), 0);
    // Repeat-meal match (signal 5): total typical weight backs the one-tap accept.
    const matched = sr?.matched_meal;
    const matchedTotal = matched ? Object.values(matched.typical_weights).reduce((a, w) => a + w, 0) : 0;
    store.updateScannedItem(localId, {
      status: 'ready',
      scanSessionId: sr?.scan_session_id,
      estimatedWeightG: qty,
      angleAgreement: sr?.angle_agreement ?? undefined,
      needsConfirmation: sr?.needs_user_confirmation || undefined,
      reconciliationNote: sr?.reconciliation_note || undefined,
      alternateWeightG: altWeight && altWeight > 0 ? altWeight : undefined,
      matchedMealName: matched?.name,
      matchedMealWeightG: matchedTotal > 0 ? matchedTotal : undefined,
    });
    const slot = findScanItem(localId)?.slot ?? slotForNow();
    scanEstimates.set(localId, {
      name: log.food_name,
      weightG: qty,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      macroSource: 'pipeline',
      readyAt: Date.now(),
      slot,
    });
    return;
  }
  // 'failed' (or 'ready' with no payload): surface the failed card, keep the row.
  store.resolvePending(localId, { name: 'Scan failed', quantityG: 0, calories: 0, protein: 0, carbs: 0, fat: 0 });
  store.setItemStatus(localId, 'failed');
}

/**
 * Fallback when the async pipeline is unavailable: run the synchronous
 * /api/scan and confirm the result directly (no review step), so a no-key /
 * degraded backend still produces a usable log. If the sync call also fails,
 * the row flips to 'failed'.
 */
function fallbackSyncScan(localId: string, slot: MealSlot, imageBase64: string, mimeType: string): void {
  api.scan
    .analyze(imageBase64, mimeType)
    .then((r) => {
      const store = useFoodStore.getState();
      store.resolvePending(localId, {
        name: r.food_name,
        quantityG: r.quantity,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        confidence: r.confidence,
      });
      store.updateScannedItem(localId, { status: 'confirmed', scanSessionId: r.scan_session_id });
      registerMealCreate(
        localId,
        api.scan.confirm({
          date: todayISO(),
          meal_type: slot,
          food_name: r.food_name,
          quantity: r.quantity,
          unit: r.unit || 'g',
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fat: r.fat,
          fibre: r.fibre,
          scan_session_id: r.scan_session_id,
        }),
      );
    })
    .catch((e: unknown) => {
      if (__DEV__) console.warn('[scan] pipeline + sync fallback both failed:', e instanceof Error ? e.message : e);
      updateFoodLogStatus(localId, 'failed');
    });
}

/** Barcode lookup — backend (Open Food Facts / USDA) first, mock DB fallback.
 *  `code` is required: callers must pass the actually-scanned barcode through
 *  (a silent default here once sent every lookup to one hardcoded product). */
export function lookupBarcodeAsync(code: string): Promise<BarcodeProduct | null> {
  return api.foodSearch
    .barcode(code)
    .then(barcodeProductFromApi)
    .catch(
      () =>
        // Backend down / not signed in / unknown code → mock DB after the same
        // brief loading window the UI was designed around.
        new Promise<BarcodeProduct | null>((resolve) => {
          setTimeout(async () => resolve((await lookupBarcode(code)) ?? null), LOOKUP_MS);
        }),
    );
}

// --- Scan review: save / discard / feedback ---------------------------------

const warn = (label: string) => (e: unknown) => {
  if (__DEV__) console.warn(`[scan] ${label}:`, e instanceof Error ? e.message : e);
};

/** Find a scanned row + the slot it lives in (its meal_type for confirm). */
function findScanItem(itemId: string): { item: StoredFoodItem; slot: MealSlot } | null {
  for (const m of useFoodStore.getState().meals) {
    const item = m.items.find((it) => it.id === itemId);
    if (item) return { item, slot: m.slot };
  }
  return null;
}

/**
 * Persist a reviewed scan row. Scales the stored (per-estimate) macros to the
 * user's chosen weight, records a /correction when the name or weight changed
 * from the AI estimate (best-effort), then /confirm persists it and the row
 * flips to 'confirmed' (registerMealCreate swaps the server id onto the row).
 * All API calls are best-effort — the local row is updated regardless so the
 * app works with no backend.
 */
export function saveScannedItem(itemId: string): void {
  stopPoller(itemId); // ready by now, but never leave a poll running
  const found = findScanItem(itemId);
  if (!found) return;
  const { item, slot } = found;

  // Macros were kept fixed at the estimate weight while reviewing; scale to the
  // chosen weight exactly once, here, so there's no repeated-rounding drift.
  const est = item.estimatedWeightG && item.estimatedWeightG > 0 ? item.estimatedWeightG : item.quantityG || 1;
  const factor = item.quantityG / est;
  const scaled = {
    calories: Math.round(item.calories * factor),
    protein: Math.round(item.protein * factor),
    carbs: Math.round(item.carbs * factor),
    fat: Math.round(item.fat * factor),
  };

  const snapshot = scanEstimates.get(itemId);
  if (item.scanSessionId && snapshot) {
    const changed = snapshot.name !== item.name || snapshot.weightG !== item.quantityG;
    if (changed) {
      api.scan
        .correction({
          scan_session_id: item.scanSessionId,
          food_name_original: snapshot.name,
          food_name_corrected: item.name,
          weight_original_g: snapshot.weightG,
          weight_corrected_g: item.quantityG,
          calories_original: snapshot.calories,
          calories_corrected: scaled.calories,
          protein_original: snapshot.protein,
          protein_corrected: scaled.protein,
          carbs_original: snapshot.carbs,
          carbs_corrected: scaled.carbs,
          fat_original: snapshot.fat,
          fat_corrected: scaled.fat,
          time_to_correction_seconds: Math.max(0, Math.round((Date.now() - snapshot.readyAt) / 1000)),
          macro_source_original: snapshot.macroSource,
        })
        .catch(warn('correction failed'));
    }
  }

  // Apply the final macros + 'confirmed' status locally (now counts toward totals).
  useFoodStore.getState().updateScannedItem(itemId, { ...scaled, status: 'confirmed' });

  // Persist. registerMealCreate swaps the returned server id onto the row and
  // swallows failures with a warn (never clobbers the local row).
  registerMealCreate(
    itemId,
    api.scan.confirm({
      date: todayISO(),
      meal_type: slot,
      food_name: item.name,
      quantity: item.quantityG,
      unit: 'g',
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      scan_session_id: item.scanSessionId,
    }),
  );

  scanEstimates.delete(itemId);
}

/** Drop a reviewed/failed/analyzing scan row without saving it. Phase 13
 *  signal 6: an outright discard is the strongest negative signal — report it
 *  (best-effort) so capture conditions that produce useless scans get learned. */
export function discardScannedItem(itemId: string): void {
  const item = findScanItem(itemId)?.item;
  stopPoller(itemId); // cancel an in-flight poll if discarded mid-analysis
  scanEstimates.delete(itemId);
  if (item?.scanSessionId) {
    api.scan
      .correction({
        scan_session_id: item.scanSessionId,
        correction_type: 'discard',
        food_name_original: item.name,
        food_name_corrected: '',
        weight_original_g: item.estimatedWeightG ?? 0,
        weight_corrected_g: 0,
        calories_original: item.calories,
        calories_corrected: 0,
        protein_original: item.protein,
        protein_corrected: 0,
        carbs_original: item.carbs,
        carbs_corrected: 0,
        fat_original: item.fat,
        fat_corrected: 0,
        time_to_correction_seconds: 0,
        macro_source_original: 'pipeline',
      })
      .catch(warn('discard signal failed'));
  }
  deleteFoodItem(itemId); // local id → no server call; server ids are cleaned up too
}

/** Send the one-tap accuracy rating for a scan session (best-effort). */
export function submitScanFeedback(scanSessionId: string, rating: ScanFeedbackRating): void {
  if (!scanSessionId) return;
  api.scan.feedback(scanSessionId, rating).catch(warn('feedback failed'));
}

export { exampleBarcodeProduct };
