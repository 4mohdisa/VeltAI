// Subscription screen (PHASE2_ROWS.md row 15).
//
// useEntitlement() reads only the on-device RevenueCat SDK cache, which can
// disagree with a refund or chargeback the webhook already recorded
// server-side. This pins the cross-check: when GET /api/subscription has an
// opinion, the screen shows THAT, not just RevenueCat's; when the server
// errs, the screen falls back to RevenueCat's own read without crashing and
// without showing a fabricated state.
import { setDevEntitled } from '@/lib/billing/purchases';
import { useSettingsStore } from '@/lib/settings/store';
import SubscriptionScreen from '@/app/profile/subscription';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { act, allText, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const render = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <SubscriptionScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  useSettingsStore.getState().reset();
});

test("shows the server's entitlement, correcting what RevenueCat alone would say", async () => {
  // RevenueCat's own (dev-mode) read says NOT entitled.
  setDevEntitled(false);
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
    url.includes('/api/subscription')
      ? json({ status: 'active', is_active: true, platform: 'ios', plan_interval: 'year', expires_at: null })
      : json({}),
  );

  const tree = render();
  await settle();

  const text = allText(tree);
  expect(text).toContain('Active');
  expect(text).not.toContain('Not subscribed');
});

test('falls back to RevenueCat without crashing or fabricating a state when the server errs', async () => {
  setDevEntitled(true);
  // 403, not 500: a permanent error isn't retried (isTransient), so the
  // fallback is observable within this test without waiting out a real
  // backoff delay.
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
    url.includes('/api/subscription')
      ? Promise.resolve({ ok: false, status: 403, json: async () => ({ data: null, error: 'boom' }) })
      : json({}),
  );

  const tree = render();
  await settle();

  const text = allText(tree);
  expect(text).toContain('Active'); // RevenueCat's own read, unchanged
  expect(text).not.toContain('Not subscribed');
});
