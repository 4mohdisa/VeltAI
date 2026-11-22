// PHASE3_ROWS.md row 8: the analytics switch on the Privacy screen
// (src/app/profile/privacy.tsx), end to end. The real store setter runs, so
// the switch reaches the PostHog sink through analytics.ts: on, an allowlisted
// event reaches PostHog capture; off again, capture stops. PostHog and fetch
// are mocked as in analyticsSink.test.ts; no network.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import PrivacyScreen from '@/app/profile/privacy';
import { track, __resetForTests } from '@/lib/analytics';
import { initAnalyticsSink, __resetSinkForTests } from '@/lib/analyticsSink';
import en from '@/lib/i18n/locales/en.json';
import { useSettingsStore } from '@/lib/settings/store';
import { act, findAll, renderScreen } from './helpers';

const mockCapture = jest.fn();
const mockOptIn = jest.fn(() => Promise.resolve());
const mockOptOut = jest.fn(() => Promise.resolve());
const mockPostHog = jest.fn(() => ({ capture: mockCapture, optIn: mockOptIn, optOut: mockOptOut, reset: jest.fn() }));
jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: function PostHog(...args: unknown[]) {
    return mockPostHog(...(args as []));
  },
}));

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn().mockResolvedValue(false),
  revokeAiConsent: jest.fn(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const ORIGINAL_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;

beforeEach(async () => {
  // Drop the previous test's client before switching off, so that reset is not
  // counted as an opt-out by the test that follows.
  __resetSinkForTests();
  useSettingsStore.setState({ analyticsEnabled: false });
  await __resetForTests();
  mockCapture.mockClear();
  mockOptIn.mockClear();
  mockOptOut.mockClear();
  mockPostHog.mockClear();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() => Promise.reject(new Error('no network in tests')));
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test_key';
  initAnalyticsSink();
});

afterAll(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
  else process.env.EXPO_PUBLIC_POSTHOG_KEY = ORIGINAL_KEY;
});

async function render() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PrivacyScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof render>>;
const analyticsSwitch = (tree: Tree) =>
  findAll(tree, (p) => p.accessibilityRole === 'switch' && p.accessibilityLabel === en.settings.analyticsLabel)[0];

const toggle = async (tree: Tree, on: boolean) => {
  await act(async () => {
    (analyticsSwitch(tree).props.onValueChange as (v: boolean) => void)(on);
  });
};

test('with analytics off, turning the switch on lets an allowlisted event reach PostHog capture', async () => {
  const tree = await render();
  expect(analyticsSwitch(tree).props.value).toBe(false);

  track('session_started');
  expect(mockCapture).not.toHaveBeenCalled();

  await toggle(tree, true);
  expect(analyticsSwitch(tree).props.value).toBe(true);
  expect(mockOptIn).toHaveBeenCalledTimes(1);

  track('scan_started', { entry: 'camera' });
  expect(mockCapture).toHaveBeenCalledTimes(1);
  expect(mockCapture).toHaveBeenCalledWith('scan_started', { entry: 'camera' });
});

test('turning the switch off again stops capture', async () => {
  const tree = await render();
  await toggle(tree, true);
  track('session_started');
  expect(mockCapture).toHaveBeenCalledTimes(1);

  await toggle(tree, false);
  expect(analyticsSwitch(tree).props.value).toBe(false);
  expect(mockOptOut).toHaveBeenCalledTimes(1);

  track('session_started');
  track('scan_started', { entry: 'camera' });
  expect(mockCapture).toHaveBeenCalledTimes(1);
});
