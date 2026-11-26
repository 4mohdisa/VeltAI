// Barcode scan screen (PHASE2_ROWS.md row 6 "Scan: barcode, label, photo",
// barcode part) — no render test executed this screen before (foodDetail.test.ts
// only greps its source text; foodLogRowMotion.render.test.tsx merely has a
// `barcode: null` fixture field). This EXECUTES the real screen:
// src/app/food/barcode-scan.tsx, whose lookup call is `lookupBarcodeResult`
// (@/lib/data/scan.ts), itself wrapping `api.foodSearch.barcode`. Mocked here
// at the `@/lib/data` level — the functions the screens actually call — the
// same way foodDetailLogged.render.test.tsx mocks `saveFood`/`unsaveFood`
// rather than the raw api client. The detail sheet the scan hands off to calls
// the same `lookupBarcodeResult`, so one mock serves both screens.
//
// The real lookup never rejects: it resolves 'found', 'notFound' (the database
// has no such product) or 'failed' (offline, timeout, 5xx), so each case here
// is simulated the same way.
import FoodDetailScreen from '@/app/food/detail';
import BarcodeScanScreen from '@/app/food/barcode-scan';
import { openFoodDetail, useDetailSubject } from '@/lib/food/detailSubject';
import { slotForNow } from '@/lib/data';
import { router } from 'expo-router';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

const mockLookup = jest.fn();
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  lookupBarcodeResult: (...args: unknown[]) => mockLookup(...args),
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

const YOGHURT = {
  name: 'Greek Yoghurt, Plain',
  brand: 'Chobani',
  kcalPer100: 59,
  proteinPer100: 10,
  carbsPer100: 4,
  fatPer100: 0,
  servingOptions: [100, 150, 170, 200],
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  mockLookup.mockReset();
  useDetailSubject.getState().clearDetail();
  (router.replace as jest.Mock).mockClear();
});

test('a known barcode calls the lookup with that code and opens the product on the detail sheet', async () => {
  mockLookup.mockResolvedValue({ status: 'found', product: YOGHURT });

  const tree = renderScreen(<BarcodeScanScreen />);
  await act(async () => {
    (buttonWithTitle(tree, 'Simulate scan')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  // One lookup per scan, and the product it found goes on with the code (Fix 26a).
  expect(mockLookup).toHaveBeenCalledTimes(1);
  expect(mockLookup).toHaveBeenCalledWith('9300605000000');
  // No ?slot here, so the meal is the one for the time of day.
  expect(useDetailSubject.getState().subject).toEqual({
    mode: 'barcode',
    code: '9300605000000',
    slot: slotForNow(),
    product: YOGHURT,
  });
  expect(router.replace).toHaveBeenCalledWith('/food/detail');

  // The sheet the scan hands off to renders the product it carried, with no
  // second lookup (Fix 26b): the scanner's call is still the only one.
  const detailTree = renderScreen(<FoodDetailScreen />);
  await settle();
  expect(allText(detailTree)).toContain('Greek Yoghurt, Plain');
  expect(mockLookup).toHaveBeenCalledTimes(1);
});

test('an unknown barcode shows "Product not found" and does not crash', async () => {
  mockLookup.mockResolvedValue({ status: 'notFound' });

  const tree = renderScreen(<BarcodeScanScreen />);
  await act(async () => {
    (buttonWithTitle(tree, 'Unknown code')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockLookup).toHaveBeenCalledTimes(1);
  expect(mockLookup).toHaveBeenCalledWith('0000000000000');
  expect(allText(tree)).toContain('Product not found');
  // No product, so no detail sheet is opened with one.
  expect(useDetailSubject.getState().subject).toBeNull();
  expect(router.replace).not.toHaveBeenCalled();
});

test('a failed lookup shows the network error with Retry, not "Product not found"', async () => {
  mockLookup.mockResolvedValue({ status: 'failed' });

  const tree = renderScreen(<BarcodeScanScreen />);
  await act(async () => {
    (buttonWithTitle(tree, 'Simulate scan')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  const text = allText(tree);
  expect(text).toContain(en.barcodeScan.lookupFailedTitle);
  expect(text).toContain(`${en.barcodeScan.lookupFailedReason} ${en.barcodeScan.lookupFailedHint}`);
  expect(text).not.toContain(en.food.productNotFound);
  expect(router.replace).not.toHaveBeenCalled();
  expect(useDetailSubject.getState().subject).toBeNull();

  act(() => {
    (buttonWithTitle(tree, en.errorState.retry)!.props.onPress as () => void)();
  });
  expect(allText(tree)).not.toContain(en.barcodeScan.lookupFailedTitle);
  expect(buttonWithTitle(tree, 'Simulate scan')).toBeDefined();
});

test('the detail sheet shows the network error on a failed lookup, and Retry looks up again', async () => {
  mockLookup.mockResolvedValueOnce({ status: 'failed' }).mockResolvedValueOnce({ status: 'found', product: YOGHURT });
  openFoodDetail({ mode: 'barcode', code: '9300605000000' });

  const tree = renderScreen(<FoodDetailScreen />);
  await settle();

  const text = allText(tree);
  expect(text).toContain(en.barcodeScan.lookupFailedTitle);
  expect(text).toContain(`${en.barcodeScan.lookupFailedReason} ${en.barcodeScan.lookupFailedHint}`);
  expect(text).not.toContain(en.food.productNotFound);
  expect(text).not.toContain(en.food.productNotFoundMessage);

  await act(async () => {
    (buttonWithTitle(tree, en.errorState.retry)!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockLookup).toHaveBeenCalledTimes(2);
  expect(mockLookup).toHaveBeenLastCalledWith('9300605000000');
  expect(allText(tree)).toContain('Greek Yoghurt, Plain');
  expect(allText(tree)).not.toContain(en.barcodeScan.lookupFailedTitle);
});
