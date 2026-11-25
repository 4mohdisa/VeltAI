// Photo-capture scan flow (PHASE2_ROWS.md row 6 "Scan: barcode, label,
// photo", photo part) — the remaining gap after barcodeScan.render.test.tsx
// and labelScan.render.test.tsx. Call sites (grepped, not assumed):
//   api.scan.pipeline      — src/lib/data/scan.ts:144  (via startPhotoScan)
//   api.scan.pipelineMulti — src/lib/data/scan.ts:206  (via startMultiPhotoScan)
//   api.scan.confirm       — src/lib/data/scan.ts:468  (via saveScannedItem)
//                             and src/lib/data/scan.ts:337 (via fallbackSyncScan)
//   api.scan.feedback      — src/lib/data/scan.ts:531  (via submitScanFeedback)
//   api.scan.analyze       — src/lib/data/scan.ts:318  (via fallbackSyncScan,
//                             reached when pipeline rejects with a non-
//                             upgrade-required error)
// Unlike barcode/label, this flow spans TWO real screens: src/app/food/
// photo-capture.tsx only ever calls pipeline/pipelineMulti (fire-and-forget —
// it navigates to the food tab immediately after) via startPhotoScan /
// startMultiPhotoScan (src/app/food/photo-capture.tsx:46,74); the resulting
// review card, and the confirm ("Save all items") / feedback (rating tap)
// calls, live entirely on src/app/(tabs)/food.tsx (onSaveAll:307-311,
// rateScan:320-323), which reads the SAME useFoodStore the capture screen
// writes to. This file mounts whichever real screen actually makes each
// call, the way barcodeScan.render.test.tsx mounts two real screens for one
// flow.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import PhotoCaptureScreen from '@/app/food/photo-capture';
import FoodLogScreen from '@/app/(tabs)/food';
import { hasAiConsent } from '@/lib/ai/consent';
import { ApiError } from '@/lib/api';
import { logMeal } from '@/lib/data';
import { scanChainsSettled } from '@/lib/data/scan';
import { useFoodStore } from '@/lib/data/foodStore';
import { useToastStore } from '@/components/display/toastStore';
import { act, findAll, renderScreen } from './helpers';

// Mocks only the four call sites under test. `...jest.requireActual(...).api`
// is one safe level of chaining off a fresh requireActual call (the module
// may still be mid-circular-load the first time this factory runs, in which
// case that access is `undefined` — safe to spread); `?.scan` keeps that same
// safety for the second level, so the real api.scan.calibration/label/
// analyze/correction (ScanReviewCard and scan.ts's own fallback/correction
// paths call these) survive untouched instead of going missing.
const mockPipeline = jest.fn();
const mockPipelineMulti = jest.fn();
const mockConfirm = jest.fn();
const mockFeedback = jest.fn();
const mockAnalyze = jest.fn();
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: {
    ...jest.requireActual('@/lib/api').api,
    scan: {
      ...jest.requireActual('@/lib/api').api?.scan,
      pipeline: (...args: unknown[]) => mockPipeline(...args),
      pipelineMulti: (...args: unknown[]) => mockPipelineMulti(...args),
      confirm: (...args: unknown[]) => mockConfirm(...args),
      feedback: (...args: unknown[]) => mockFeedback(...args),
      analyze: (...args: unknown[]) => mockAnalyze(...args),
    },
  },
}));

// Consent is granted here unless a test says otherwise; without it the
// screen opens /ai-consent instead of capturing.
jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn(() => Promise.resolve(true)),
}));

// A real pipeline success starts a 60s-deadline poller (src/lib/data/
// scanPoller.ts) — out of scope here (neither pipeline/pipelineMulti's own
// contract nor confirm/feedback touch it), and left running it would hold
// real timers open well past this file's assertions. Same no-op stub as
// scanSeam.test.ts.
jest.mock('@/lib/data/scanPoller', () => ({ startScanPoller: jest.fn(() => jest.fn()) }));

// Same forwardRef stub as labelScan.render.test.tsx: this screen's capture
// button calls `cameraRef.current?.takePictureAsync(...)` directly, with no
// dev-only simulate button to drive instead.
const mockTakePicture = jest.fn();
jest.mock('expo-camera', () =>
  jest.requireActual<typeof import('./cameraMock')>('./cameraMock').cameraMock(() => mockTakePicture),
);

// Skeleton/SkeletonList animate through reanimated's useReducedMotion,
// unavailable in this render environment (same gap noted in
// foodLogRowMotion.render.test.tsx, which mounts this same FoodLogScreen);
// neither test here asserts on the loading state.
jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const press = (tree: ReturnType<typeof renderScreen>, label: string) => {
  act(() => {
    (findAll(tree, (p) => p.accessibilityLabel === label)[0].props.onPress as () => void)();
  });
};

const pressTitle = (tree: ReturnType<typeof renderScreen>, title: string) => {
  act(() => {
    (findAll(tree, (p) => p.title === title)[0].props.onPress as () => void)();
  });
};

beforeEach(() => {
  mockPipeline.mockReset();
  mockPipelineMulti.mockReset();
  mockConfirm.mockReset();
  mockFeedback.mockReset();
  mockAnalyze.mockReset();
  mockTakePicture.mockReset();
  useFoodStore.getState().reset();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() => json([]));
  (router.replace as jest.Mock).mockClear();
  useToastStore.getState().dismiss();
});

function renderCapture() {
  return renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PhotoCaptureScreen />
    </SafeAreaProvider>,
  );
}

async function renderFoodLog() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FoodLogScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

test('capturing one photo and using it calls api.scan.pipeline with that image, then navigates to the food tab', async () => {
  mockTakePicture.mockResolvedValue({ base64: 'b64-top' });
  mockPipeline.mockResolvedValue({ log_id: 'log-top', scan_session_id: 'sess-top', status: 'analyzing' });

  const tree = renderCapture();
  press(tree, 'Capture photo');
  await settle();
  pressTitle(tree, 'Use this photo');
  await act(async () => {
    await scanChainsSettled();
  });

  expect(mockPipeline).toHaveBeenCalledWith('b64-top', 'image/jpeg');
  expect(router.replace).toHaveBeenCalledWith('/(tabs)/food');
  expect(useToastStore.getState().current).toMatchObject({ message: 'Scanning your meal…', tone: 'info' });
});

test('capturing two angles and using both calls api.scan.pipelineMulti with both images', async () => {
  mockTakePicture.mockResolvedValueOnce({ base64: 'b64-top' }).mockResolvedValueOnce({ base64: 'b64-side' });
  mockPipelineMulti.mockResolvedValue({ log_id: 'log-multi', scan_session_id: 'sess-multi', status: 'analyzing' });

  const tree = renderCapture();
  press(tree, 'Capture photo');
  await settle();
  pressTitle(tree, 'Add a side angle');
  await settle();
  pressTitle(tree, 'Use 2 shots');
  await act(async () => {
    await scanChainsSettled();
  });

  expect(mockPipelineMulti).toHaveBeenCalledWith([
    { image_base64: 'b64-top', mime_type: 'image/jpeg', angle: 'top' },
    { image_base64: 'b64-side', mime_type: 'image/jpeg', angle: 'side' },
  ]);
  expect(useToastStore.getState().current).toMatchObject({ message: 'Scanning 2 angles…', tone: 'info' });
});

test('a pipeline rejection from an exhausted scan quota shows the real paywall toast, without crashing', async () => {
  mockTakePicture.mockResolvedValue({ base64: 'b64-top' });
  mockPipeline.mockRejectedValue(new ApiError(402, 'Scan limit reached', { upgradeRequired: true }));

  const tree = renderCapture();
  press(tree, 'Capture photo');
  await settle();
  pressTitle(tree, 'Use this photo');
  await act(async () => {
    await scanChainsSettled();
  });

  expect(mockPipeline).toHaveBeenCalledWith('b64-top', 'image/jpeg');
  expect(useToastStore.getState().current).toMatchObject({ message: 'Scan limit reached', tone: 'info' });
});

test('a used-up daily AI allowance shows the server message, drops the placeholder and does not fall back', async () => {
  const message = "You've used today's AI allowance. It resets at midnight UTC.";
  mockTakePicture.mockResolvedValue({ base64: 'b64-top' });
  mockPipeline.mockRejectedValue(new ApiError(429, message, { code: 'ai_daily_limit_reached' }));

  const itemCount = () => Object.values(useFoodStore.getState().byDate).flat().flatMap((m) => m.items).length;
  const before = itemCount();

  const tree = renderCapture();
  press(tree, 'Capture photo');
  await settle();
  pressTitle(tree, 'Use this photo');
  await act(async () => {
    await scanChainsSettled();
  });

  expect(useToastStore.getState().current).toMatchObject({ message, tone: 'info' });
  expect(mockAnalyze).not.toHaveBeenCalled();
  expect(itemCount()).toBe(before);
});

test('a plain 429 with no code keeps the existing sync fallback, not the daily-limit message', async () => {
  mockTakePicture.mockResolvedValue({ base64: 'b64-top' });
  mockPipeline.mockRejectedValue(new ApiError(429, 'too many requests'));
  mockAnalyze.mockRejectedValue(new ApiError(429, 'too many requests'));

  const tree = renderCapture();
  press(tree, 'Capture photo');
  await settle();
  pressTitle(tree, 'Use this photo');
  await act(async () => {
    await scanChainsSettled();
  });

  expect(mockAnalyze).toHaveBeenCalledTimes(1);
  expect(useToastStore.getState().current).toMatchObject({ message: 'Scanning your meal…', tone: 'info' });
});

test('a non-upgrade pipeline rejection falls back to the sync scan, calling api.scan.analyze then api.scan.confirm', async () => {
  mockTakePicture.mockResolvedValue({ base64: 'b64-top' });
  mockPipeline.mockRejectedValue(new Error('503'));
  mockAnalyze.mockResolvedValue({
    food_name: 'Grilled Chicken',
    brand: '',
    quantity: 150,
    unit: 'g',
    calories: 250,
    protein: 40,
    carbs: 5,
    fat: 8,
    fibre: 0,
    confidence: 0.8,
    scan_session_id: 'sess-sync',
  });
  mockConfirm.mockResolvedValue({ id: 'server-sync' });

  const tree = renderCapture();
  press(tree, 'Capture photo');
  await settle();
  pressTitle(tree, 'Use this photo');
  await act(async () => {
    await scanChainsSettled();
  });

  expect(mockAnalyze).toHaveBeenCalledTimes(1);
  expect(mockAnalyze).toHaveBeenCalledWith('b64-top', 'image/jpeg');
  expect(mockConfirm).toHaveBeenCalledTimes(1);
  expect(mockConfirm).toHaveBeenCalledWith(
    expect.objectContaining({
      food_name: 'Grilled Chicken',
      quantity: 150,
      unit: 'g',
      calories: 250,
      protein: 40,
      carbs: 5,
      fat: 8,
      fibre: 0,
      scan_session_id: 'sess-sync',
    }),
  );
});

test('pressing "Save all items" on a ready scanned item calls api.scan.confirm with the reviewed item', async () => {
  mockConfirm.mockResolvedValue({ id: 'server-9' });
  const tree = await renderFoodLog();

  act(() => {
    const id = logMeal('Breakfast', { name: 'Grilled Chicken', quantityG: 150, calories: 250, protein: 40, carbs: 5, fat: 8 }, 'photo', true);
    useFoodStore.getState().updateScannedItem(id, { status: 'ready', scanSessionId: 'sess-9', estimatedWeightG: 150 });
  });
  await settle();

  pressTitle(tree, 'Save all items');
  await act(async () => {
    await scanChainsSettled();
  });

  expect(mockConfirm).toHaveBeenCalledWith(
    expect.objectContaining({
      meal_type: 'Breakfast',
      food_name: 'Grilled Chicken',
      quantity: 150,
      unit: 'g',
      calories: 250,
      protein: 40,
      carbs: 5,
      fat: 8,
      scan_session_id: 'sess-9',
    }),
  );
});

test('rating the scan after saving calls api.scan.feedback with that scan session and the chosen rating', async () => {
  mockConfirm.mockResolvedValue({ id: 'server-9' });
  mockFeedback.mockResolvedValue({ updated: true });
  const tree = await renderFoodLog();

  act(() => {
    const id = logMeal('Breakfast', { name: 'Grilled Chicken', quantityG: 150, calories: 250, protein: 40, carbs: 5, fat: 8 }, 'photo', true);
    useFoodStore.getState().updateScannedItem(id, { status: 'ready', scanSessionId: 'sess-9', estimatedWeightG: 150 });
  });
  await settle();

  pressTitle(tree, 'Save all items');
  await settle();

  press(tree, 'Spot on');

  expect(mockFeedback).toHaveBeenCalledWith('sess-9', 'spot_on');
});

test('without consent, Capture opens /ai-consent and takes no photo and sends no scan', async () => {
  (hasAiConsent as jest.Mock).mockResolvedValueOnce(false);
  const tree = renderCapture();
  press(tree, 'Capture photo');
  await settle();

  expect(router.push).toHaveBeenCalledWith('/ai-consent');
  expect(mockTakePicture).not.toHaveBeenCalled();
  expect(mockPipeline).not.toHaveBeenCalled();
  expect(mockPipelineMulti).not.toHaveBeenCalled();
  expect(mockAnalyze).not.toHaveBeenCalled();
});
