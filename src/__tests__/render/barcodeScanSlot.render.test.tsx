// DESIGN_INTENT.md Fix list 1, Barcode path: a barcode scanned from a meal's
// "Add to dinner" hands that meal to the detail sheet in the subject store, the
// way the search path does (never as a route param). Mounts the real
// scanner with the camera and the lookup mocked (no network), the same way
// barcodeScan.render.test.tsx does; the clock is fixed at 8 am, a breakfast hour.
import { router, useLocalSearchParams } from 'expo-router';

import BarcodeScanScreen from '@/app/food/barcode-scan';
import { useDetailSubject } from '@/lib/food/detailSubject';
import { act, buttonWithTitle, renderScreen } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  lookupBarcodeResult: jest.fn(async () => ({ status: 'found', product: { name: 'Greek Yoghurt', kcalPer100: 59 } })),
}));
jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
  CameraView: () => null,
}));

// Only Date is faked, so the render and its async flushes run on real timers.
beforeAll(() => {
  jest.useFakeTimers({
    now: new Date(2026, 10, 27, 8, 0, 0),
    doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'performance', 'hrtime'],
  });
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.mocked(router.replace).mockClear();
  useDetailSubject.getState().clearDetail();
});

/** Scan the known code (the screen's dev "Simulate scan" runs the camera's handler). */
async function scan(params: { slot?: string }) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  const tree = renderScreen(<BarcodeScanScreen />);
  await act(async () => {
    (buttonWithTitle(tree, 'Simulate scan')!.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

test.each([
  ['a dinner slot is passed on as dinner', { slot: 'Dinner' }, 'Dinner'],
  ['no slot passes the meal for the time of day', {}, 'Breakfast'],
  ['an invalid slot falls back to the meal for the time of day', { slot: 'Brunch' }, 'Breakfast'],
])('%s', async (_label, params, expected) => {
  await scan(params);
  expect(useDetailSubject.getState().subject).toEqual({ mode: 'barcode', code: '9300605000000', slot: expected });
  expect(router.replace).toHaveBeenCalledWith('/food/detail');
});
