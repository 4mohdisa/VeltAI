// DESIGN_INTENT.md Fix list 1, meal photo scan: a meal photographed from a
// meal's "Add to breakfast" is logged to breakfast. Mounts the real capture
// screen with the scan calls mocked, the camera stubbed and consent granted, as
// render/photoScan.render.test.tsx does; the clock is fixed at 7 pm, a dinner hour.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import PhotoCaptureScreen from '@/app/food/photo-capture';
import { startMultiPhotoScan } from '@/lib/data';
import { act, findAll, renderScreen } from './render/helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  startPhotoScan: jest.fn(),
  startMultiPhotoScan: jest.fn(),
}));
jest.mock('@/lib/ai/consent', () => ({ hasAiConsent: jest.fn(() => Promise.resolve(true)) }));
jest.mock('expo-camera', () =>
  jest
    .requireActual<typeof import('./render/cameraMock')>('./render/cameraMock')
    .cameraMock(() => jest.fn(async () => ({ base64: 'IMG', uri: 'file://meal.jpg' }))),
);

// Only Date is faked, so the render and its async flushes run on real timers.
beforeAll(() => {
  jest.useFakeTimers({
    now: new Date(2026, 10, 27, 19, 0, 0),
    doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'performance', 'hrtime'],
  });
});
afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.mocked(startMultiPhotoScan).mockClear();
});

/** Take one photo, use it, and return the meal the scan was started for. */
async function scannedMeal(params: { slot?: string }) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PhotoCaptureScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    (findAll(tree, (p) => p.accessibilityLabel === 'Capture photo')[0].props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
  act(() => (findAll(tree, (p) => p.title === 'Use this photo')[0].props.onPress as () => void)());
  return jest.mocked(startMultiPhotoScan).mock.calls[0][1];
}

test.each([
  ['a breakfast slot is logged as breakfast', { slot: 'Breakfast' }, 'Breakfast'],
  ['no slot falls back to the meal for the time of day', {}, 'Dinner'],
  ['an invalid slot falls back to the meal for the time of day', { slot: 'breakfast' }, 'Dinner'],
])('%s', async (_label, params, expected) => {
  expect(await scannedMeal(params)).toBe(expected);
});
