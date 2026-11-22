// PHASE3_ROWS.md row 8: sign-out resets the PostHog identity, so two accounts
// on one phone never share an anonymous ID. resetAnalytics() is what sign-out
// calls (resetAllStores). PostHog is mocked; secure-store is the in-memory jest
// mock, so nothing touches the network.
import { resetAnalytics } from '@/lib/analytics';
import { initAnalyticsSink, __resetSinkForTests } from '@/lib/analyticsSink';

const mockReset = jest.fn();
const mockPostHog = jest.fn(() => ({
  capture: jest.fn(),
  optIn: jest.fn(() => Promise.resolve()),
  optOut: jest.fn(() => Promise.resolve()),
  reset: mockReset,
}));
jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: function PostHog(...args: unknown[]) {
    return mockPostHog(...(args as []));
  },
}));

const ORIGINAL_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;

beforeEach(() => {
  mockReset.mockClear();
  mockPostHog.mockClear();
  __resetSinkForTests();
});

afterAll(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
  else process.env.EXPO_PUBLIC_POSTHOG_KEY = ORIGINAL_KEY;
});

test('with a key, resetAnalytics resets the PostHog identity once', async () => {
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
  initAnalyticsSink();
  await resetAnalytics();
  expect(mockReset).toHaveBeenCalledTimes(1);
});

test('with no key, resetAnalytics calls nothing and does not throw', async () => {
  delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
  initAnalyticsSink();
  await expect(resetAnalytics()).resolves.toBeUndefined();
  expect(mockPostHog).not.toHaveBeenCalled();
  expect(mockReset).not.toHaveBeenCalled();
});
