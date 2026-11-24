// Nutrition-label scan screen (PHASE2_ROWS.md row 6 "Scan: barcode, label,
// photo", label part) — no render test executed this screen before
// (apiSurface.test.ts only asserts api.scan.label exists; phase14Regression
// only greps source text for call ordering). This EXECUTES the real screen:
// src/app/food/label-scan.tsx, which calls `api.scan.label` directly — there
// is no `@/lib/data/scan.ts` wrapper for the label path (only the barcode and
// camera-scan paths go through that module) — so the mock here targets
// `@/lib/api`'s `api.scan` the same way recipeLog.render.test.tsx mocks
// `api.recipes`.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import LabelScanScreen from '@/app/food/label-scan';
import { useToastStore } from '@/components/display/toastStore';
import { act, allText, findAll, renderScreen } from './helpers';

// The capture viewfinder renders CaptureGuidanceOverlay, which reads
// useSafeAreaInsets — unlike barcode-scan.tsx (plain SafeAreaView only),
// this needs a real provider in the tree (same pattern as recipeLog.render
// .test.tsx's MealsScreen wrap).
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const mockScanLabel = jest.fn();
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: {
    ...jest.requireActual('@/lib/api').api,
    scan: { label: (...args: unknown[]) => mockScanLabel(...args) },
  },
}));

// The one-time AI disclosure (ensureAiConsent) blocks on a real Alert in prod;
// same stand-in as aiQuery.render.test.tsx / insights.render.test.tsx —
// consent is always granted so the capture path under test is reached.
jest.mock('@/lib/ai/consent', () => ({
  ensureAiConsent: jest.fn(() => Promise.resolve(true)),
}));

// CameraView is a native component with no jest-env implementation. Unlike
// barcodeScan.render.test.tsx (which drives a dev-only "Simulate scan"
// button), this screen's capture button calls `cameraRef.current
// ?.takePictureAsync(...)` directly with no such dev affordance, so the stub
// must actually back the ref: a forwardRef component that exposes
// takePictureAsync via useImperativeHandle, the minimum needed to drive the
// real onPress handler.
const mockTakePicture = jest.fn();
jest.mock('expo-camera', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
    CameraView: React.forwardRef(function CameraView(_props: unknown, ref: unknown) {
      React.useImperativeHandle(ref, () => ({ takePictureAsync: mockTakePicture }));
      return null;
    }),
  };
});

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const pressCapture = (tree: ReturnType<typeof renderScreen>) => {
  act(() => {
    (findAll(tree, (p) => p.accessibilityLabel === 'Capture label')[0].props.onPress as () => void)();
  });
};

beforeEach(() => {
  mockScanLabel.mockClear();
  mockTakePicture.mockClear();
  useToastStore.getState().dismiss();
});

test('capturing a label calls api.scan.label and the review screen shows the parsed per-serving nutrition', async () => {
  mockTakePicture.mockResolvedValue({ base64: 'b64-label' });
  mockScanLabel.mockResolvedValue({
    food_name: 'Rolled Oats',
    serving_size_g: 40,
    calories_per_100g: 370,
    protein_per_100g: 13,
    carbs_per_100g: 60,
    fat_per_100g: 7,
    fibre_per_100g: 10,
    confidence: 90,
  });

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <LabelScanScreen />
    </SafeAreaProvider>,
  );
  pressCapture(tree);
  await settle();
  await settle();

  expect(mockScanLabel).toHaveBeenCalledWith('b64-label');
  expect(allText(tree)).toContain('Nutrition Label Scanned');
  expect(allText(tree)).toContain('High confidence');

  expect(findAll(tree, (p) => p.accessibilityLabel === 'Food name')[0].props.value).toBe('Rolled Oats');
  expect(findAll(tree, (p) => p.accessibilityLabel === 'Serving size')[0].props.value).toBe('40');
  expect(findAll(tree, (p) => p.accessibilityLabel === 'Calories per serving')[0].props.value).toBe('148');
  expect(findAll(tree, (p) => p.accessibilityLabel === 'Protein (g)')[0].props.value).toBe('5.2');
  expect(findAll(tree, (p) => p.accessibilityLabel === 'Carbs (g)')[0].props.value).toBe('24');
  expect(findAll(tree, (p) => p.accessibilityLabel === 'Fat (g)')[0].props.value).toBe('2.8');
  expect(findAll(tree, (p) => p.accessibilityLabel === 'Fibre (g)')[0].props.value).toBe('4');
});

test('a failed label scan shows the zeroed review with a low-confidence badge and an error toast, without crashing', async () => {
  mockTakePicture.mockResolvedValue({ base64: 'b64-bad' });
  mockScanLabel.mockRejectedValue(new Error('503'));

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <LabelScanScreen />
    </SafeAreaProvider>,
  );
  pressCapture(tree);
  await settle();
  await settle();

  expect(mockScanLabel).toHaveBeenCalledWith('b64-bad');
  expect(allText(tree)).toContain('Nutrition Label Scanned');
  expect(allText(tree)).toContain('Low confidence');
  expect(findAll(tree, (p) => p.accessibilityLabel === 'Calories per serving')[0].props.value).toBe('0');
  expect(useToastStore.getState().current).toMatchObject({
    message: 'Couldn’t read the label — enter values manually',
    tone: 'warn',
  });
});
