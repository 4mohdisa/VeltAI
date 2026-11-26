// Profile > Subscription (src/app/profile/subscription.tsx) mounts
// BillingProblemBanner above the status card (Row 8): it shows for the
// server's billing issue state (past_due) and is absent for an active plan.
// Only the entitlement hook and its refetch are replaced; the rest of the data
// layer runs on a mocked fetch, as in dashboardSummary.render.test.tsx. The
// purchases wrapper is never loaded.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import SubscriptionScreen from '@/app/profile/subscription';
import en from '@/lib/i18n/locales/en.json';
import type { ServerEntitlement } from '@/lib/settings/store';
import { act, buttonWithTitle, findAll, renderScreen, screenTitle } from './helpers';

let mockEntitlement: ServerEntitlement = null;
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useServerEntitlement: () => mockEntitlement,
  hydrateSubscription: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/purchases/revenuecat', () => {
  throw new Error('the banner must not load the purchases wrapper');
});

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const tryAgain = en.subscription.billingProblem.tryAgain;

// No RevenueCat key in tests, so the billing seam warns once that it runs in
// billing-disabled dev mode. Swallow only that, and fail on any other warning.
let warn: jest.SpyInstance;

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({ data: {}, error: null }) }),
  );
});

afterEach(() => {
  for (const [message] of warn.mock.calls) expect(message).toMatch(/^RevenueCat unavailable/);
  warn.mockRestore();
});

async function renderSubscription() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <SubscriptionScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

const bannerAction = (tree: Awaited<ReturnType<typeof renderSubscription>>) =>
  findAll(tree, (p) => p.accessibilityLabel === tryAgain && typeof p.onPress === 'function');

test('a billing issue shows the banner on Subscription', async () => {
  mockEntitlement = { isActive: true, status: 'past_due' };
  const tree = await renderSubscription();
  expect(screenTitle(tree)).toBe(en.settings.subscription);
  expect(bannerAction(tree)).not.toHaveLength(0);
});

test('an active plan shows no banner on Subscription', async () => {
  mockEntitlement = { isActive: true, status: 'active' };
  const tree = await renderSubscription();
  expect(screenTitle(tree)).toBe(en.settings.subscription);
  expect(bannerAction(tree)).toHaveLength(0);
});

const manageLabel = en.subscription.manage;
const manageLabels = (tree: Awaited<ReturnType<typeof renderSubscription>>) =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.children === manageLabel);

test('a billing issue shows Manage subscription once, on the banner', async () => {
  mockEntitlement = { isActive: true, status: 'past_due' };
  const tree = await renderSubscription();
  expect(screenTitle(tree)).toBe(en.settings.subscription);
  expect(manageLabels(tree)).toHaveLength(1);
  expect(buttonWithTitle(tree, manageLabel)).toBeUndefined();
});

test('an active plan keeps the footer Manage subscription button', async () => {
  mockEntitlement = { isActive: true, status: 'active' };
  const tree = await renderSubscription();
  expect(screenTitle(tree)).toBe(en.settings.subscription);
  expect(buttonWithTitle(tree, manageLabel)).toBeDefined();
  expect(bannerAction(tree)).toHaveLength(0);
});
