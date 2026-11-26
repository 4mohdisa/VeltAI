// Today (src/app/(tabs)/index.tsx) mounts BillingProblemBanner above the cards
// (Row 8): it shows for the server's billing issue state (past_due) and is
// absent for an active plan. Only the entitlement hook and its refetch are
// replaced; the rest of the data layer runs on a mocked fetch, as in
// dashboardSummary.render.test.tsx. The purchases wrapper is never loaded.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import DashboardScreen from '@/app/(tabs)/index';
import en from '@/lib/i18n/locales/en.json';
import type { ServerEntitlement } from '@/lib/settings/store';
import { act, findAll, renderScreen, screenTitle } from './helpers';

let mockEntitlement: ServerEntitlement = null;
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useServerEntitlement: () => mockEntitlement,
  hydrateSubscription: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/purchases/revenuecat', () => {
  throw new Error('the banner must not load the purchases wrapper');
});
// Skeleton and StreakFlame need reanimated's useReducedMotion, which this
// render environment does not provide; nothing here asserts on either.
jest.mock('@/components/display', () => ({
  ...jest.requireActual('@/components/display'),
  Skeleton: () => null,
}));
jest.mock('@/components/display/StreakFlame', () => ({ StreakFlame: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const tryAgain = en.subscription.billingProblem.tryAgain;

beforeEach(() => {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({ data: [], error: null }) }),
  );
});

async function renderToday() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <DashboardScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

const bannerAction = (tree: Awaited<ReturnType<typeof renderToday>>) =>
  findAll(tree, (p) => p.accessibilityLabel === tryAgain && typeof p.onPress === 'function');

test('a billing issue shows the banner on Today', async () => {
  mockEntitlement = { isActive: true, status: 'past_due' };
  const tree = await renderToday();
  expect(screenTitle(tree)).toBe(en.dashboard.summaryTitle);
  expect(bannerAction(tree)).not.toHaveLength(0);
});

test('an active plan shows no banner on Today', async () => {
  mockEntitlement = { isActive: true, status: 'active' };
  const tree = await renderToday();
  expect(screenTitle(tree)).toBe(en.dashboard.summaryTitle);
  expect(bannerAction(tree)).toHaveLength(0);
});
