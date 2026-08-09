// Scan mutations — the async seam for the AI/lookup paths. When an image is
// provided, the real backend scan (Gemini) runs and the confirmed result is
// persisted server-side; with no image, or when the backend is unreachable, the
// mock resolution is the offline experience (capture-first UX keeps working).
import { api, type FoodLog } from '@/lib/api';
import { track } from '@/lib/analytics';
import { deleteFoodItem, logMeal, registerMealCreate } from './mutations';
import { barcodeProductFromApi, isServerId, todayISO } from './mappers';
import { useFoodStore, type StoredFoodItem } from './foodStore';
import { startScanPoller } from './scanPoller';
import { aiDetectedItems, type DetectedItem } from '@/lib/mock/ai';
import { exampleBarcodeProduct, lookupBarcode, type BarcodeProduct } from '@/lib/food/barcode';
import type { MealSlot } from '@/lib/mock/data';
import type { ScanFeedbackRating } from '@/lib/types';
import { handleUpgradeRequired, isUpgradeRequired } from '@/lib/billing/upgradePrompt';
import { isDevBuild } from '@/lib/env';

// Active status pollers keyed by the LOCAL review-row id, so save/discard can
// cancel a still-running poll. Pollers also self-terminate on ready/failed/60s.
const activePollers = new Map<string, () => void>();

// In-flight scan chains. Starting a scan is deliberately fire-and-forget — the
// capture screen navigates away immediately and the store row is filled in
// later by the poller — so the caller gets no handle. Retaining one here costs
// nothing at runtime and makes the async surface OBSERVABLE: tests can await
// settlement instead of guessing with a timer, and a future "is a scan still
// running?" UI has something to read. Entries remove themselves on settle.
const inFlightScans = new Set<Promise<void>>();

/** Track a fire-and-forget scan chain. The chain already handles its own
 *  failures; this only records that it is still running. */
function trackScanChain(p: Promise<void>): void {
  const tracked = p.finally(() => {
    inFlightScans.delete(tracked);
  });
  inFlightScans.add(tracked);
}

/** The free daily scan allowance is spent: remove the optimistic placeholder
 *  (there will be no result to fill it) and present the paywall. */
function scanBlockedByQuota(localId: string, e: unknown): void {
  deleteFoodItem(localId);
  void handleUpgradeRequired(e);
}

/** Resolves once every in-flight scan chain has settled, including chains
 *  started by a fallback while we waited. Used by tests to await the real work
 *  rather than racing a timer. */
export async function scanChainsSettled(): Promise<void> {
  while (inFlightScans.size > 0) {
    await Promise.allSettled([...inFlightScans]);
  }
}

/** Where a scan came from. Carried on every event of that scan's lifecycle so
 *  success rate can be read per entry point — a camera scan failing and a label
 *  scan failing are different problems with different fixes. */
export type ScanEntry = 'camera' | 'barcode' | 'label';

// localId → entry point. Written when the scan starts, read by the later
// lifecycle events, deleted when the scan reaches a terminal state. Bounded by
// the number of in-review rows, which the UI already caps.
const scanEntries = new Map<string, ScanEntry>();

/** The entry point a scan started from; defaults to camera for rows that
 *  predate the map (a scan already in review across a hot reload). */
export function scanEntryOf(localId: string): ScanEntry {
  return scanEntries.get(localId) ?? 'camera';
}

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
export function startPhotoScan(
  imageBase64?: string,
  mimeType = 'image/jpeg',
  entry: ScanEntry = 'camera',
): MealSlot {
  const slot = slotForNow();
  track('scan_started', { entry });

  if (imageBase64) {
    const id = logMeal(slot, pendingPlaceholder, 'photo', true);
    scanEntries.set(id, entry);
    trackScanChain(
      api.scan
      .pipeline(imageBase64, mimeType)
      .then(({ log_id, scan_session_id }) => {
        // Row stays 'analyzing'; remember the session AND the server row id
        // (serverLogId is what discard deletes), then poll for 'ready'.
        useFoodStore.getState().updateScannedItem(id, { scanSessionId: scan_session_id, serverLogId: log_id });
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
        // 402 = out of free scans. The sync endpoint is gated identically, so
        // falling back would just burn a second refusal: surface the paywall
        // and drop the placeholder row instead.
        if (isUpgradeRequired(e)) return scanBlockedByQuota(id, e);
        // Pipeline unavailable (503 no key / unreachable) → old sync endpoint.
        if (__DEV__) console.warn('[scan] pipeline unavailable, falling back to sync scan:', e instanceof Error ? e.message : e);
        fallbackSyncScan(id, slot, imageBase64, mimeType);
      }),
    );
    return slot;
  }

  // No image. In a RELEASE build this must write NOTHING: the caller reaches
  // here only when the capture itself failed, and the mock path below logs
  // three invented foods ('Chicken stir-fry 420 kcal', …) into the user's real
  // log after a fake 'analyzing' delay. That is fabricated data presented as
  // the user's own — App Store 2.1 — so it is dev-only.
  if (!isDevBuild()) return slot;

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
  track('scan_started', { entry: 'camera' });
  const id = logMeal(slot, pendingPlaceholder, 'photo', true);
  scanEntries.set(id, 'camera');
  trackScanChain(
    api.scan
    .pipelineMulti(images)
    .then(({ log_id, scan_session_id }) => {
      useFoodStore.getState().updateScannedItem(id, { scanSessionId: scan_session_id, serverLogId: log_id });
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
      if (isUpgradeRequired(e)) return scanBlockedByQuota(id, e);
      // Multi endpoint unavailable → degrade to the single-image path with the
      // primary (top) shot; never lose the capture.
      if (__DEV__) console.warn('[scan] multi pipeline unavailable, falling back:', e instanceof Error ? e.message : e);
      const primary = images.find((im) => im.angle === 'top') ?? images[0];
      fallbackSyncScan(id, slot, primary.image_base64, primary.mime_type ?? 'image/jpeg');
    }),
  );
  return slot;
}

/**
 * Apply a scan status transition (driven by the poller) onto the local review
 * row. `localId` is the local store row (not the server log id). On 'ready' the
 * completed food_log fills the row and marks it for review, snapshotting the AI
 * estimate for a later /correction. On 'failed' the row surfaces the
 * ScanFailedCard.
 */
export function updateFoodLogStatus(
  localId: string,
  status: 'ready' | 'failed',
  log?: FoodLog | null,
  reason = 'pipeline_failed',
): void {
  const store = useFoodStore.getState();
  const entry = scanEntryOf(localId);
  if (status === 'ready' && log) {
    // Every scan that reaches a usable estimate, whatever the entry point. The
    // pair (scan_started, scan_completed) is what makes success rate answerable
    // — before this, a scan that died in the poller emitted nothing at all.
    track('scan_completed', { entry });
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
      // The pipeline's own verdict. These travelled over the wire on every poll
      // and were thrown away here, so the review card had to invent a breakdown.
      confidenceLabel: sr?.confidence?.label,
      confidenceFactors: sr?.confidence?.factors,
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
  // The reason is a fixed tag, never a server message — an error string can
  // carry a food name or an id, and nothing free-text may enter an event.
  track('scan_failed', { entry, reason: status === 'ready' ? 'empty_result' : reason });
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
  trackScanChain(
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
      // The sync fallback both completes and confirms in one step (no review).
      track('scan_completed', { entry: scanEntryOf(localId) });
      track('scan_confirmed', { entry: scanEntryOf(localId) });
      scanEntries.delete(localId);
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
      updateFoodLogStatus(localId, 'failed', null, 'pipeline_and_sync_failed');
    }),
  );
}

/** Barcode lookup — backend (Open Food Facts / USDA) first, mock DB fallback.
 *  `code` is required: callers must pass the actually-scanned barcode through
 *  (a silent default here once sent every lookup to one hardcoded product). */
export function lookupBarcodeAsync(code: string): Promise<BarcodeProduct | null> {
  // A barcode lookup is a scan from the user's point of view, so it reports the
  // same lifecycle — otherwise "scan success rate" silently means "camera scan
  // success rate" and the entry point with its own failure mode (product simply
  // not in the database) is invisible. The code itself is NEVER an event
  // property: it identifies a specific product the user ate.
  track('scan_started', { entry: 'barcode' });
  return api.foodSearch
    .barcode(code)
    .then(barcodeProductFromApi)
    .then((p) => {
      if (p) track('scan_completed', { entry: 'barcode' });
      else track('scan_failed', { entry: 'barcode', reason: 'not_found' });
      return p;
    })
    .catch(() => {
      track('scan_failed', { entry: 'barcode', reason: 'lookup_error' });
      // The mock DB has ONE product in it. In a release build, falling back to
      // it means scanning that single real-world barcode while the backend is
      // down returns invented Chobani macros presented as a database hit, and
      // every other code silently reports "not found" when the truth is "we
      // could not reach the server". Dev keeps it so the flow is demoable;
      // release returns null and the caller shows its not-found overlay.
      if (!isDevBuild()) return null;
      return new Promise<BarcodeProduct | null>((resolve) => {
        setTimeout(async () => resolve((await lookupBarcode(code)) ?? null), LOOKUP_MS);
      });
    });
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
      track('scan_corrected', { entry: scanEntryOf(itemId) });
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
  track('scan_confirmed', { entry: scanEntryOf(itemId) });
  scanEntries.delete(itemId);

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
 *  (best-effort) so capture conditions that produce useless scans get learned.
 *
 *  The server row DIES here too (audit 2026-08-06): the pipeline created a
 *  real food_logs row for this scan, and pre-audit nothing deleted it, so the
 *  estimate the user explicitly rejected resurrected as a review card on the
 *  next refresh — and, once 'ready', sat in the log forever. */
export function discardScannedItem(itemId: string): void {
  const item = findScanItem(itemId)?.item;
  stopPoller(itemId); // cancel an in-flight poll if discarded mid-analysis
  scanEstimates.delete(itemId);
  track('scan_discarded', { entry: scanEntryOf(itemId) });
  scanEntries.delete(itemId);
  const serverRow = item?.serverLogId ?? (item && isServerId(item.id) ? item.id : undefined);
  if (serverRow) {
    api.foodLogs.delete(serverRow).catch(warn('discard: server row delete failed'));
  }
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
