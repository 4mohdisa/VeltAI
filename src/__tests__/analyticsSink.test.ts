// PHASE3_ROWS.md row 8, step 2a: the PostHog sink. With no key there is no
// client and nothing is sent; with a key, only opted-in events reach it, and
// only with their sanitised properties. secure-store is the in-memory jest mock.
import { useSettingsStore } from '@/lib/settings/store';
import { track, __resetForTests } from '@/lib/analytics';
import { initAnalyticsSink, sendToSink, __resetSinkForTests } from '@/lib/analyticsSink';

const mockCapture = jest.fn();
const mockOptIn = jest.fn(() => Promise.resolve());
const mockOptOut = jest.fn(() => Promise.resolve());
const mockPostHog = jest.fn(() => ({ capture: mockCapture, optIn: mockOptIn, optOut: mockOptOut }));
jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: function PostHog(...args: unknown[]) {
    return mockPostHog(...(args as []));
  },
}));

const ORIGINAL_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;

beforeEach(async () => {
  mockCapture.mockClear();
  mockPostHog.mockClear();
  __resetSinkForTests();
  useSettingsStore.getState().setAnalyticsEnabled(true);
  await __resetForTests();
});

afterAll(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
  else process.env.EXPO_PUBLIC_POSTHOG_KEY = ORIGINAL_KEY;
});

test('with no key, init creates no client and send makes no call', () => {
  delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
  initAnalyticsSink();
  sendToSink('session_started');
  track('session_started');
  expect(mockPostHog).not.toHaveBeenCalled();
  expect(mockCapture).not.toHaveBeenCalled();
});

test('the client is anonymous and records no session replay', () => {
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
  initAnalyticsSink();
  expect(mockPostHog).toHaveBeenCalledWith(
    'phc_test',
    expect.objectContaining({ enableSessionReplay: false, personProfiles: 'never' }),
  );
});

test('with a key and analytics off, nothing is sent', () => {
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
  initAnalyticsSink();
  useSettingsStore.getState().setAnalyticsEnabled(false);
  track('scan_started', { entry: 'camera' });
  expect(mockCapture).not.toHaveBeenCalled();
});

test('with analytics on, only sanitised properties reach the sink', () => {
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
  initAnalyticsSink();
  track('scan_failed', { entry: 'barcode', reason: 'not_found', weight_kg: 82 });
  expect(mockCapture).toHaveBeenCalledTimes(1);
  expect(mockCapture).toHaveBeenCalledWith('scan_failed', { entry: 'barcode', reason: 'not_found' });
});

test('turning analytics off opts the PostHog client out', () => {
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
  initAnalyticsSink();
  mockOptOut.mockClear();
  useSettingsStore.getState().setAnalyticsEnabled(false);
  expect(mockOptOut).toHaveBeenCalledTimes(1);
});

test('turning analytics on opts the PostHog client in', () => {
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
  initAnalyticsSink();
  useSettingsStore.getState().setAnalyticsEnabled(false);
  mockOptIn.mockClear();
  useSettingsStore.getState().setAnalyticsEnabled(true);
  expect(mockOptIn).toHaveBeenCalledTimes(1);
});

test('PostHog starts opted out until the user turns analytics on', () => {
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
  initAnalyticsSink();
  expect(mockPostHog).toHaveBeenCalledWith('phc_test', expect.objectContaining({ defaultOptIn: false }));
});

test('with EXPO_PUBLIC_POSTHOG_HOST set, the client uses that host', () => {
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
  process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://eu.example.test';
  try {
    initAnalyticsSink();
  } finally {
    delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
  }
  expect(mockPostHog).toHaveBeenCalledWith('phc_test', expect.objectContaining({ host: 'https://eu.example.test' }));
});

test('with EXPO_PUBLIC_POSTHOG_HOST unset, no host option is passed', () => {
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
  delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
  initAnalyticsSink();
  expect(mockPostHog).toHaveBeenCalledWith('phc_test', expect.not.objectContaining({ host: expect.anything() }));
});
