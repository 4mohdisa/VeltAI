// Scan seam (src/lib/data/scan.ts) — pipeline wiring, sync fallback, status
// transitions, and the discard signal, exercised over the REAL foodStore.
// Hermetic: the API client and the poller are jest.fn()s; no network, no timers
// beyond a microtask flush (and fake timers for the mock no-image path).
/* eslint-disable import/first -- jest.mock must be hoisted above the imports it replaces */
jest.mock('@/lib/api', () => ({
  // ApiError must be the REAL class: scan.ts branches on `instanceof ApiError`
  // (the 402 entitlement path), and a mock without it makes that check throw.
  ApiError: jest.requireActual('@/lib/api').ApiError,
  api: {
    scan: {
      pipeline: jest.fn(),
      pipelineMulti: jest.fn(),
      analyze: jest.fn(),
      confirm: jest.fn(),
      correction: jest.fn(),
      feedback: jest.fn(),
    },
  },
}));
jest.mock('@/lib/data/scanPoller', () => ({ startScanPoller: jest.fn(() => jest.fn()) }));

import { api, ApiError, type FoodLog, type ScanAngleImage, type ScanEstimate, type ScanResults } from '@/lib/api';
import { startScanPoller } from '@/lib/data/scanPoller';
import { discardScannedItem, scanChainsSettled, slotForNow, startMultiPhotoScan, startPhotoScan, updateFoodLogStatus } from '@/lib/data/scan';
import { useFoodStore, type StoredFoodItem } from '@/lib/data/foodStore';
import { aiDetectedItems } from '@/lib/mock/ai';

// scan.ts guards its warns behind __DEV__; make sure it exists in the node env.
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const pipelineMock = api.scan.pipeline as jest.Mock;
const pipelineMultiMock = api.scan.pipelineMulti as jest.Mock;
const analyzeMock = api.scan.analyze as jest.Mock;
const confirmMock = api.scan.confirm as jest.Mock;
const correctionMock = api.scan.correction as jest.Mock;
const pollerMock = startScanPoller as jest.Mock;

// Await the REAL in-flight scan chains (pipeline → then/catch → fallback →
// confirm) rather than racing a timer. scan.ts starts them fire-and-forget (the
// capture screen navigates away immediately), so it exposes a settlement handle;
// a setTimeout(0) guess here used to let work leak past the test boundary and
// blow up on a torn-down environment under load.
const flush = () => scanChainsSettled();

const allItems = () => useFoodStore.getState().meals.flatMap((m) => m.items);
const idsNow = () => new Set(allItems().map((i) => i.id));
const newSince = (pre: Set<string>) => allItems().filter((i) => !pre.has(i.id));

const baseLog: FoodLog = {
  id: 'log-1',
  user_id: 'u1',
  date: '2026-07-24',
  meal_type: 'Lunch',
  food_name: 'Grilled chicken',
  brand: null,
  barcode: null,
  quantity: 150,
  unit: 'g',
  calories: 250,
  protein: 30,
  carbs: 0,
  fat: 12,
  fibre: 0,
  source: 'scan',
  created_at: '2026-07-24T02:00:00Z',
  status: 'ready',
  scan_results: { scan_session_id: 'sess-1', confidence: { score: 85, label: 'high' } },
};
const makeLog = (overrides: Partial<FoodLog>): FoodLog => ({ ...baseLog, ...overrides });

const altEst = (weight_g: number): ScanEstimate => ({
  region_id: 1,
  food_name: 'Alt',
  weight_g,
  confidence: 0.5,
  macro_source: 'gemini',
  calories_per_100g: 100,
  protein_per_100g: 5,
  carbs_per_100g: 10,
  fat_per_100g: 3,
  fibre_per_100g: 1,
});

const syncScanResult = {
  food_name: 'Chicken salad',
  brand: '',
  quantity: 320,
  unit: 'g',
  calories: 410,
  protein: 35,
  carbs: 12,
  fat: 22,
  fibre: 4,
  confidence: 0.8,
  scan_session_id: 'sess-sync',
};

/** A pending 'analyzing' placeholder row, created straight on the store. */
const pendingRow = () =>
  useFoodStore.getState().logMeal('Lunch', { name: 'Analyzing…', quantityG: 0, calories: 0, protein: 0, carbs: 0, fat: 0 }, 'photo', true);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  useFoodStore.getState().reset();
  confirmMock.mockResolvedValue({ id: 'a1b2c3d4-1111-4222-8333-444455556666' });
  correctionMock.mockResolvedValue({ success: true, calibration_updated: false });
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('slotForNow', () => {
  test.each([
    [8, 'Breakfast'],
    [10, 'Breakfast'],
    [11, 'Lunch'],
    [14, 'Lunch'],
    [15, 'Snacks'],
    [16, 'Snacks'],
    [17, 'Dinner'],
    [23, 'Dinner'],
  ])('hour %i → %s', (hour, want) => {
    expect(slotForNow(new Date(2026, 6, 24, hour))).toBe(want);
  });
});

describe('startPhotoScan (async pipeline)', () => {
  test('logs a pending row, stores the session id, and wires the poller to it', async () => {
    pipelineMock.mockResolvedValue({ log_id: 'log-1', scan_session_id: 'sess-1', status: 'analyzing' });
    const pre = idsNow();
    startPhotoScan('IMG', 'image/png');

    // Capture-first: the placeholder is in the store synchronously.
    const rows = newSince(pre);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'Analyzing…', pending: true });

    await flush();
    expect(pipelineMock).toHaveBeenCalledWith('IMG', 'image/png');
    expect(newSince(pre)[0].scanSessionId).toBe('sess-1');
    expect(pollerMock).toHaveBeenCalledTimes(1);
    expect(pollerMock.mock.calls[0][0]).toBe('log-1');

    // Poller reports ready → the SAME local row fills in for review.
    const onReady = pollerMock.mock.calls[0][1] as (log: FoodLog) => void;
    onReady(makeLog({}));
    expect(newSince(pre)[0]).toMatchObject({
      name: 'Grilled chicken',
      quantityG: 150,
      calories: 250,
      confidence: 0.85, // score 85 → 0..1
      status: 'ready',
      estimatedWeightG: 150,
      pending: false,
    });
  });

  test('poller failure flips the row to the failed card', async () => {
    pipelineMock.mockResolvedValue({ log_id: 'log-1', scan_session_id: 'sess-1', status: 'analyzing' });
    const pre = idsNow();
    startPhotoScan('IMG');
    await flush();
    expect(pipelineMock).toHaveBeenCalledWith('IMG', 'image/jpeg'); // default mime
    const onFailed = pollerMock.mock.calls[0][2] as () => void;
    onFailed();
    expect(newSince(pre)[0]).toMatchObject({ name: 'Scan failed', status: 'failed' });
  });

  test('pipeline rejection falls back to sync /api/scan and confirms directly (no review)', async () => {
    pipelineMock.mockRejectedValue(new Error('503'));
    analyzeMock.mockResolvedValue(syncScanResult);
    const pre = idsNow();
    const slot = startPhotoScan('IMG');
    await flush();

    expect(analyzeMock).toHaveBeenCalledWith('IMG', 'image/jpeg');
    expect(pollerMock).not.toHaveBeenCalled();
    expect(newSince(pre)[0]).toMatchObject({
      name: 'Chicken salad',
      quantityG: 320,
      calories: 410,
      status: 'confirmed',
      scanSessionId: 'sess-sync',
    });
    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        meal_type: slot,
        food_name: 'Chicken salad',
        quantity: 320,
        unit: 'g',
        calories: 410,
        fibre: 4,
        scan_session_id: 'sess-sync',
      }),
    );
  });

  test('pipeline AND sync fallback both failing flips the row to failed', async () => {
    pipelineMock.mockRejectedValue(new Error('down'));
    analyzeMock.mockRejectedValue(new Error('down'));
    const pre = idsNow();
    startPhotoScan('IMG');
    await flush();
    expect(newSince(pre)[0]).toMatchObject({ name: 'Scan failed', status: 'failed' });
    expect(confirmMock).not.toHaveBeenCalled();
  });

  test('no image → mock path resolves the detected items after the analyze delay', () => {
    jest.useFakeTimers();
    try {
      const pre = idsNow();
      startPhotoScan();
      const skeletons = newSince(pre);
      expect(skeletons).toHaveLength(aiDetectedItems.length);
      expect(skeletons.every((r) => r.pending)).toBe(true);

      jest.advanceTimersByTime(1600);
      const resolved = newSince(pre);
      expect(resolved.map((r) => r.name)).toEqual(aiDetectedItems.map((d) => d.name));
      expect(resolved.every((r) => !r.pending)).toBe(true);
      expect(pipelineMock).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('startMultiPhotoScan', () => {
  test('one image delegates to the single-image path', async () => {
    pipelineMock.mockResolvedValue({ log_id: 'log-1', scan_session_id: 'sess-1', status: 'analyzing' });
    startMultiPhotoScan([{ image_base64: 'ONE', angle: 'top' }]);
    await flush();
    expect(pipelineMock).toHaveBeenCalledWith('ONE', 'image/jpeg');
    expect(pipelineMultiMock).not.toHaveBeenCalled();
  });

  test('2+ images call the multi pipeline and wire the poller + session id', async () => {
    pipelineMultiMock.mockResolvedValue({ log_id: 'log-m', scan_session_id: 'sess-m', status: 'analyzing' });
    const images: ScanAngleImage[] = [
      { image_base64: 'T', angle: 'top' },
      { image_base64: 'S', angle: 'side' },
    ];
    const pre = idsNow();
    startMultiPhotoScan(images);
    await flush();
    expect(pipelineMultiMock).toHaveBeenCalledWith(images);
    expect(pipelineMock).not.toHaveBeenCalled();
    expect(pollerMock.mock.calls[0][0]).toBe('log-m');
    expect(newSince(pre)[0].scanSessionId).toBe('sess-m');
  });

  test.each<{ name: string; images: ScanAngleImage[]; want: string }>([
    {
      name: 'top angle present → top image',
      images: [
        { image_base64: 'S', angle: 'side' },
        { image_base64: 'T', angle: 'top' },
      ],
      want: 'T',
    },
    {
      name: 'no top angle → first image',
      images: [
        { image_base64: 'S', angle: 'side', mime_type: 'image/png' },
        { image_base64: 'O', angle: 'oblique' },
      ],
      want: 'S',
    },
  ])('multi pipeline rejection falls back to sync with the primary shot ($name)', async ({ images, want }) => {
    pipelineMultiMock.mockRejectedValue(new Error('503'));
    analyzeMock.mockResolvedValue(syncScanResult);
    startMultiPhotoScan(images);
    await flush();
    const primary = images.find((im) => im.image_base64 === want)!;
    expect(analyzeMock).toHaveBeenCalledWith(want, primary.mime_type ?? 'image/jpeg');
  });
});

describe('updateFoodLogStatus', () => {
  const pick = (r: StoredFoodItem) => ({
    status: r.status,
    scanSessionId: r.scanSessionId,
    confidence: r.confidence,
    estimatedWeightG: r.estimatedWeightG,
    angleAgreement: r.angleAgreement,
    needsConfirmation: r.needsConfirmation,
    reconciliationNote: r.reconciliationNote,
    alternateWeightG: r.alternateWeightG,
  });

  test.each<{ name: string; scanResults: ScanResults; want: ReturnType<typeof pick> }>([
    {
      name: 'multi-angle metadata carried onto the row',
      scanResults: {
        scan_session_id: 'sess-r',
        confidence: { score: 85, label: 'high' },
        angle_agreement: 0.62,
        needs_user_confirmation: true,
        reconciliation_note: 'Angles disagree on rice weight',
        alternate_estimates: [altEst(120), altEst(80)],
      },
      want: {
        status: 'ready',
        scanSessionId: 'sess-r',
        confidence: 0.85,
        estimatedWeightG: 150,
        angleAgreement: 0.62,
        needsConfirmation: true,
        reconciliationNote: 'Angles disagree on rice weight',
        alternateWeightG: 200, // sum of the alternate estimates
      },
    },
    {
      name: 'single-shot scan → no angle metadata',
      scanResults: { scan_session_id: 'sess-r' },
      want: {
        status: 'ready',
        scanSessionId: 'sess-r',
        confidence: undefined,
        estimatedWeightG: 150,
        angleAgreement: undefined,
        needsConfirmation: undefined,
        reconciliationNote: undefined,
        alternateWeightG: undefined,
      },
    },
    {
      name: 'null agreement / false confirmation / zero-weight alternates normalise to undefined',
      scanResults: {
        scan_session_id: 'sess-r',
        angle_agreement: null,
        needs_user_confirmation: false,
        reconciliation_note: '',
        alternate_estimates: [altEst(0)],
      },
      want: {
        status: 'ready',
        scanSessionId: 'sess-r',
        confidence: undefined,
        estimatedWeightG: 150,
        angleAgreement: undefined,
        needsConfirmation: undefined,
        reconciliationNote: undefined,
        alternateWeightG: undefined,
      },
    },
  ])('ready: $name', ({ scanResults, want }) => {
    const id = pendingRow();
    updateFoodLogStatus(id, 'ready', makeLog({ scan_results: scanResults }));
    const row = allItems().find((i) => i.id === id)!;
    expect(row).toMatchObject({ name: 'Grilled chicken', quantityG: 150, calories: 250, pending: false });
    expect(pick(row)).toEqual(want);
  });

  test('failed keeps the row and surfaces the failed card', () => {
    const id = pendingRow();
    updateFoodLogStatus(id, 'failed');
    expect(allItems().find((i) => i.id === id)).toMatchObject({
      name: 'Scan failed',
      status: 'failed',
      calories: 0,
      pending: false,
    });
  });

  test('ready with no log payload degrades to the failed card', () => {
    const id = pendingRow();
    updateFoodLogStatus(id, 'ready', null);
    expect(allItems().find((i) => i.id === id)).toMatchObject({ name: 'Scan failed', status: 'failed' });
  });
});

describe('discardScannedItem', () => {
  test('with a scan session: sends the discard correction and deletes the row', () => {
    const store = useFoodStore.getState();
    const id = store.logMeal('Dinner', { name: 'Rice', quantityG: 100, calories: 130, protein: 3, carbs: 28, fat: 1 }, 'photo', false);
    store.updateScannedItem(id, { status: 'ready', scanSessionId: 'sess-d', estimatedWeightG: 100 });

    discardScannedItem(id);

    expect(correctionMock).toHaveBeenCalledTimes(1);
    expect(correctionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scan_session_id: 'sess-d',
        correction_type: 'discard',
        food_name_original: 'Rice',
        food_name_corrected: '',
        weight_original_g: 100,
        weight_corrected_g: 0,
        calories_original: 130,
        calories_corrected: 0,
        protein_original: 3,
        carbs_original: 28,
        fat_original: 1,
        macro_source_original: 'pipeline',
      }),
    );
    expect(allItems().some((i) => i.id === id)).toBe(false);
  });

  test('without a scan session: no correction call, row still deleted', () => {
    const store = useFoodStore.getState();
    const id = store.logMeal('Dinner', { name: 'Rice', quantityG: 100, calories: 130, protein: 3, carbs: 28, fat: 1 }, 'photo', false);
    discardScannedItem(id);
    expect(correctionMock).not.toHaveBeenCalled();
    expect(allItems().some((i) => i.id === id)).toBe(false);
  });
});

// --- Entitlement (402): out of free scans -----------------------------------
// The sync endpoint is gated identically, so a 402 must NOT fall through to the
// fallback (that would just burn a second refusal and leave a stuck skeleton).
describe('scan quota exhausted', () => {
  const quotaError = () =>
    new ApiError(402, "You've used all your free scans for today.", { upgradeRequired: true, feature: 'ai_scan' });

  test('402 on the single-image pipeline does not call the sync fallback and drops the placeholder', async () => {
    const pre = idsNow();
    pipelineMock.mockRejectedValueOnce(quotaError());
    analyzeMock.mockClear();

    startPhotoScan('IMG', 'image/jpeg');
    await flush();

    expect(analyzeMock).not.toHaveBeenCalled();
    // No orphaned "Analyzing…" skeleton left behind.
    expect(newSince(pre)).toHaveLength(0);
  });

  test('402 on the multi pipeline does not call the sync fallback', async () => {
    const pre = idsNow();
    pipelineMultiMock.mockRejectedValueOnce(quotaError());
    analyzeMock.mockClear();

    startMultiPhotoScan([
      { image_base64: 'A', angle: 'top' },
      { image_base64: 'B', angle: 'side' },
    ]);
    await flush();

    expect(analyzeMock).not.toHaveBeenCalled();
    expect(newSince(pre)).toHaveLength(0);
  });

  test('a NON-402 failure still falls back (the quota check must not swallow real errors)', async () => {
    pipelineMock.mockRejectedValueOnce(new ApiError(503, 'no key'));
    analyzeMock.mockClear();
    analyzeMock.mockResolvedValueOnce({
      food_name: 'Toast', quantity: 50, unit: 'g', calories: 120,
      protein: 4, carbs: 20, fat: 2, fibre: 1, confidence: 70, scan_session_id: 's9',
    });
    confirmMock.mockResolvedValueOnce({ id: 'srv-9' });

    startPhotoScan('IMG', 'image/jpeg');
    await flush();

    expect(analyzeMock).toHaveBeenCalledWith('IMG', 'image/jpeg');
  });
});
