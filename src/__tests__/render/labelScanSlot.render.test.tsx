// DESIGN_INTENT.md Fix list 1, label scan: a label photographed for a meal's
// "Add to dinner" keeps dinner as its meal. Mounts the real screen with the
// router mocked and the camera stubbed as labelScan.render.test.tsx does; the
// clock is fixed at 8 am, a breakfast hour.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import LabelScanScreen from '@/app/food/label-scan';
import { act, findAll, renderScreen } from './helpers';

// CaptureGuidanceOverlay reads useSafeAreaInsets, so the tree needs a provider with metrics.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

let mockParams: { slot?: string } = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/lib/ai/consent', () => ({ hasAiConsent: jest.fn(() => Promise.resolve(true)) }));
// No base64 from the camera opens the zeroed review without calling the API.
jest.mock('expo-camera', () =>
  jest.requireActual<typeof import('./cameraMock')>('./cameraMock').cameraMock(() => jest.fn(async () => ({}))),
);

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

/** Mount with the given params, capture, and return the review's meal. */
async function reviewMeal(params: { slot?: string }) {
  mockParams = params;
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <LabelScanScreen />
    </SafeAreaProvider>,
  );
  act(() => {
    (findAll(tree, (p) => p.accessibilityLabel === 'Capture label')[0].props.onPress as () => void)();
  });
  await act(async () => new Promise((r) => setImmediate(r)));
  await act(async () => new Promise((r) => setImmediate(r)));
  return findAll(tree, (p) => Array.isArray(p.options) && p.onChange !== undefined)[0].props.value;
}

test('a label scanned for dinner keeps dinner', async () => {
  expect(await reviewMeal({ slot: 'Dinner' })).toBe('Dinner');
});

test('with no meal chosen, the label goes to the meal for the time of day', async () => {
  expect(await reviewMeal({})).toBe('Breakfast');
});
