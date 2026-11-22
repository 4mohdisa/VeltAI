// PHASE3_ROWS.md row 13, camera screen strings: barcode-scan, label-scan,
// photo-capture and the shared CaptureGuidanceOverlay read their copy from t(),
// so switching the language to Spanish changes it. Expected text comes from
// es.json so a wording change does not break the test.
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import BarcodeScanScreen from '@/app/food/barcode-scan';
import LabelScanScreen from '@/app/food/label-scan';
import PhotoCaptureScreen from '@/app/food/photo-capture';
import i18n from '@/lib/i18n';
import es from '@/lib/i18n/locales/es.json';
import { act, allText, buttonWithTitle, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const mockLookup = jest.fn();
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  lookupBarcodeAsync: (...args: unknown[]) => mockLookup(...args),
}));

const mockScanLabel = jest.fn();
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: {
    ...jest.requireActual('@/lib/api').api,
    scan: { label: (...args: unknown[]) => mockScanLabel(...args) },
  },
}));

jest.mock('@/lib/ai/consent', () => ({
  ensureAiConsent: jest.fn(() => Promise.resolve(true)),
}));

// Permission is switchable per test; the camera stub backs the ref so the
// label-scan capture button reaches takePictureAsync.
let mockPermission = { granted: true, canAskAgain: true };
const mockTakePicture = jest.fn();
jest.mock('expo-camera', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    useCameraPermissions: () => [mockPermission, jest.fn()],
    CameraView: React.forwardRef((_props: unknown, ref: unknown) => {
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

const render = (el: ReactElement) =>
  renderScreen(<SafeAreaProvider initialMetrics={METRICS}>{el}</SafeAreaProvider>);

beforeEach(async () => {
  mockPermission = { granted: true, canAskAgain: true };
  await act(async () => {
    await i18n.changeLanguage('es');
  });
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('barcode scan: the viewfinder hint and the not-found overlay are in Spanish', async () => {
  mockLookup.mockResolvedValue(null);
  const tree = render(<BarcodeScanScreen />);
  await settle();
  expect(allText(tree)).toContain(es.barcodeScan.hint);

  await act(async () => {
    (buttonWithTitle(tree, 'Unknown code')!.props.onPress as () => void)();
  });
  await settle();
  const text = allText(tree);
  expect(text).toContain(es.food.productNotFound);
  expect(text).toContain(es.barcodeScan.notFoundMessage);
  expect(buttonWithTitle(tree, es.barcodeScan.photographLabel)).toBeDefined();
  expect(buttonWithTitle(tree, es.barcodeScan.tryAnother)).toBeDefined();
});

test('photo capture: the camera permission screen is in Spanish', async () => {
  mockPermission = { granted: false, canAskAgain: true };
  const tree = render(<PhotoCaptureScreen />);
  await settle();
  const text = allText(tree);
  expect(text).toContain(es.camera.accessTitle);
  expect(text).toContain(es.photoCapture.permissionMessage);
  expect(buttonWithTitle(tree, es.camera.allow)).toBeDefined();
  expect(buttonWithTitle(tree, es.camera.notNow)).toBeDefined();
});

test('photo capture: the viewfinder guidance and overlay are in Spanish', async () => {
  const tree = render(<PhotoCaptureScreen />);
  await settle();
  const text = allText(tree);
  expect(text).toContain(es.photoCapture.guidanceTop);
  expect(text).toContain(es.captureGuide.positionPlate);
  expect(text).toContain(es.captureGuide.angle);
  expect(findAll(tree, (p) => p.accessibilityLabel === es.photoCapture.capturePhoto).length).toBeGreaterThan(0);
});

test('label scan: the viewfinder and the review screen are in Spanish', async () => {
  const tree = render(<LabelScanScreen />);
  await settle();
  const viewfinder = allText(tree);
  expect(viewfinder).toContain(es.labelScan.title);
  expect(viewfinder).toContain(es.labelScan.subtitle);
  expect(viewfinder).toContain(es.captureGuide.alignLabel);

  mockTakePicture.mockResolvedValue({ base64: 'b64-label' });
  mockScanLabel.mockResolvedValue({
    food_name: 'Avena',
    serving_size_g: 40,
    calories_per_100g: 370,
    protein_per_100g: 13,
    carbs_per_100g: 60,
    fat_per_100g: 7,
    fibre_per_100g: 10,
    confidence: 90,
  });
  act(() => {
    (findAll(tree, (p) => p.accessibilityLabel === es.labelScan.captureLabel)[0].props.onPress as () => void)();
  });
  await settle();
  await settle();

  const review = allText(tree);
  expect(review).toContain(es.labelScan.reviewTitle);
  expect(review).toContain(es.labelScan.confidenceHigh);
  expect(review).toContain(es.labelScan.caloriesPerServing);
  expect(review).toContain(es.addMenu.breakfast);
  expect(review).toContain('5 g de proteína · 24 g de carbohidratos · 3 g de grasa');
  expect(buttonWithTitle(tree, es.labelScan.saveButton)).toBeDefined();
});
