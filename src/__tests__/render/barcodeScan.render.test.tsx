// Barcode scan screen (PHASE2_ROWS.md row 6 "Scan: barcode, label, photo",
// barcode part) — no render test executed this screen before (foodDetail.test.ts
// only greps its source text; foodLogRowMotion.render.test.tsx merely has a
// `barcode: null` fixture field). This EXECUTES the real screen:
// src/app/food/barcode-scan.tsx, whose lookup call is `lookupBarcodeAsync`
// (@/lib/data/scan.ts), itself wrapping `api.foodSearch.barcode`. Mocked here
// at the `lookupBarcodeAsync` level — the function the screen actually calls —
// the same way foodDetailLogged.render.test.tsx mocks `saveFood`/`unsaveFood`
// from `@/lib/data` rather than the raw api client.
//
// The screen has no try/catch around its lookup; its real implementation
// (scan.ts) never rejects — a failed backend lookup resolves null via its own
// internal .catch — so the "not found" case here is simulated the same way:
// resolving null, not rejecting.
import FoodDetailScreen from '@/app/food/detail';
import BarcodeScanScreen from '@/app/food/barcode-scan';
import { useDetailSubject } from '@/lib/food/detailSubject';
import { router } from 'expo-router';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

const mockLookup = jest.fn();
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  lookupBarcodeAsync: (...args: unknown[]) => mockLookup(...args),
}));

// CameraView is a native component with no jest-env implementation; this
// screen's own dev-only "Simulate scan"/"Unknown code" buttons exercise the
// same onDetected handler the real camera callback would, so the native view
// itself is stood in for rather than driven.
jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
  CameraView: () => null,
}));

// detail.tsx's barcode-mode loading state renders SkeletonList, which animates
// through reanimated's useReducedMotion — unavailable in this render
// environment (same gap noted in foodLogRowMotion.render.test.tsx). Neither
// test here asserts on the loading state, so a plain stand-in is enough.
jest.mock('@/components/display/LoadingSkeleton', () => ({
  Skeleton: () => null,
  SkeletonList: () => null,
}));

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  mockLookup.mockClear();
  useDetailSubject.getState().clearDetail();
  (router.replace as jest.Mock).mockClear();
});

test('a known barcode calls the lookup with that code and opens the product on the detail sheet', async () => {
  mockLookup.mockResolvedValue({
    name: 'Greek Yoghurt, Plain',
    brand: 'Chobani',
    kcalPer100: 59,
    proteinPer100: 10,
    carbsPer100: 4,
    fatPer100: 0,
    servingOptions: [100, 150, 170, 200],
  });

  const tree = renderScreen(<BarcodeScanScreen />);
  await act(async () => {
    (buttonWithTitle(tree, 'Simulate scan')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockLookup).toHaveBeenCalledWith('9300605000000');
  expect(useDetailSubject.getState().subject).toEqual({ mode: 'barcode', code: '9300605000000' });
  expect(router.replace).toHaveBeenCalledWith('/food/detail');

  // The sheet the scan hands off to renders the real product off that same code.
  const detailTree = renderScreen(<FoodDetailScreen />);
  await settle();
  expect(allText(detailTree)).toContain('Greek Yoghurt, Plain');
});

test('an unknown barcode shows "Product not found" and does not crash', async () => {
  mockLookup.mockResolvedValue(null);

  const tree = renderScreen(<BarcodeScanScreen />);
  await act(async () => {
    (buttonWithTitle(tree, 'Unknown code')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockLookup).toHaveBeenCalledWith('0000000000000');
  expect(allText(tree)).toContain('Product not found');
});
