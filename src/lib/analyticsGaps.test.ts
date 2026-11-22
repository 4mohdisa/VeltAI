// PHASE3_ROWS.md row 8 test gaps: analytics is off until the user chooses, the
// Settings → Privacy switch (useSettingsStore.setAnalyticsEnabled, which
// src/app/profile/privacy.tsx calls) decides whether PostHog's capture runs,
// no key means no PostHog at all, and PRIVACY_DATA.md lists exactly the
// allowlisted events. PostHog is mocked; secure-store is the in-memory jest mock.
import { readFileSync } from 'fs';
import { join } from 'path';

import { ALLOWED_EVENTS, initAnalytics, track, __resetForTests } from '@/lib/analytics';
import { initAnalyticsSink, __resetSinkForTests } from '@/lib/analyticsSink';
import { useSettingsStore } from '@/lib/settings/store';
import { deleteItem, STORAGE_KEYS } from '@/lib/storage/secureStore';

const mockCapture = jest.fn();
const mockPostHog = jest.fn(() => ({
  capture: mockCapture,
  optIn: jest.fn(() => Promise.resolve()),
  optOut: jest.fn(() => Promise.resolve()),
  reset: jest.fn(),
}));
jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: function PostHog(...args: unknown[]) {
    return mockPostHog(...(args as []));
  },
}));

const ORIGINAL_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const setSwitch = (on: boolean) => useSettingsStore.getState().setAnalyticsEnabled(on);

beforeEach(async () => {
  mockCapture.mockClear();
  mockPostHog.mockClear();
  __resetSinkForTests();
  await __resetForTests();
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() => Promise.reject(new Error('no network in tests')));
});

afterAll(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
  else process.env.EXPO_PUBLIC_POSTHOG_KEY = ORIGINAL_KEY;
});

test('with no stored choice, analytics is off after launch, even if memory said on', async () => {
  await deleteItem(STORAGE_KEYS.analyticsEnabled);
  useSettingsStore.setState({ analyticsEnabled: true });
  await initAnalytics();
  expect(useSettingsStore.getState().analyticsEnabled).toBe(false);
});

test('switching analytics on and then off decides whether PostHog capture runs', () => {
  process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
  initAnalyticsSink();

  setSwitch(true);
  track('session_started');
  expect(mockCapture).toHaveBeenCalledTimes(1);
  expect(mockCapture).toHaveBeenCalledWith('session_started', undefined);

  setSwitch(false);
  track('session_started');
  expect(mockCapture).toHaveBeenCalledTimes(1);
});

test('with no EXPO_PUBLIC_POSTHOG_KEY, no PostHog client exists and capture never runs', () => {
  delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
  initAnalyticsSink();
  setSwitch(true);
  track('session_started');
  track('scan_started', { entry: 'camera' });
  expect(mockPostHog).not.toHaveBeenCalled();
  expect(mockCapture).not.toHaveBeenCalled();
});

test('PRIVACY_DATA.md lists exactly the allowlisted events', () => {
  const doc = readFileSync(join(__dirname, '..', '..', 'PRIVACY_DATA.md'), 'utf8');
  const section = doc.split('## Analytics events')[1]?.split('\n## ')[0] ?? '';
  const listed = [...section.matchAll(/^\| `([a-z_]+)` \|/gm)].map((m) => m[1]);
  expect(listed.length).toBeGreaterThan(0);
  expect([...listed].sort()).toEqual(Object.keys(ALLOWED_EVENTS).sort());
});
