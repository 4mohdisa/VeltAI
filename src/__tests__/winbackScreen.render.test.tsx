// Win back screen (src/app/profile/winback.tsx, Row 8). Shown for an expired
// or cancelled server record, with the store's own price from the purchases
// wrapper (mocked here, so the RevenueCat SDK is never loaded). An active plan
// or no record goes back to Subscription and renders nothing.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import WinbackScreen from '@/app/profile/winback';
import en from '@/lib/i18n/locales/en.json';
import { paywallHref, WINBACK_REASON } from '@/lib/nav';
import { getOfferings } from '@/lib/purchases/revenuecat';
import type { Offering } from '@/lib/purchases/types';
import type { ServerEntitlement } from '@/lib/settings/store';
import { act, allText, buttonWithTitle, renderScreen, screenTitle } from './render/helpers';

let mockEntitlement: ServerEntitlement = null;
jest.mock('@/lib/data', () => ({
  ...jest.requireActual('@/lib/data'),
  useServerEntitlement: () => mockEntitlement,
}));
jest.mock('@/lib/purchases/revenuecat', () => ({ getOfferings: jest.fn() }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const OFFERING: Offering = {
  identifier: 'default',
  packages: [{ identifier: '$rc_annual', productId: 'pro_year', priceString: '$9.99', periodLabel: 'Yearly', trialEligible: false }],
};
const priceLine = en.subscription.winback.price.replace('{{price}}', '$9.99').replace('{{period}}', 'Yearly');

async function renderWinback() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <WinbackScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

const press = (tree: Awaited<ReturnType<typeof renderWinback>>, title: string) =>
  act(async () => {
    (buttonWithTitle(tree, title)!.props.onPress as () => void)();
  });

beforeEach(() => {
  jest.mocked(getOfferings).mockReset().mockResolvedValue([OFFERING]);
});

test('while the store loads, the offer shows without a price', async () => {
  mockEntitlement = { isActive: false, status: 'expired' };
  jest.mocked(getOfferings).mockReturnValue(new Promise(() => {}));
  const tree = await renderWinback();
  expect(screenTitle(tree)).toBe(en.subscription.winback.title);
  expect(allText(tree)).toContain(en.subscription.checking);
  expect(allText(tree)).not.toContain(priceLine);
});

test("an expired plan shows the store's price; Resubscribe opens the paywall and Not now goes back", async () => {
  mockEntitlement = { isActive: false, status: 'expired' };
  const tree = await renderWinback();
  expect(screenTitle(tree)).toBe(en.subscription.winback.title);
  expect(allText(tree)).toContain(en.subscription.winback.body);
  expect(allText(tree)).toContain(priceLine);

  await press(tree, en.subscription.expired.resubscribe);
  expect(router.push).toHaveBeenCalledWith(paywallHref(WINBACK_REASON));
  await press(tree, en.subscription.winback.notNow);
  expect(router.back).toHaveBeenCalledTimes(1);
  expect(router.replace).not.toHaveBeenCalled();
});

test('a cancelled plan shows the offer', async () => {
  mockEntitlement = { isActive: true, status: 'cancelled' };
  const tree = await renderWinback();
  expect(screenTitle(tree)).toBe(en.subscription.winback.title);
  expect(allText(tree)).toContain(priceLine);
});

test.each([
  ['an active plan', { isActive: true, status: 'active' }],
  ['no server record', null],
] as const)('%s renders nothing and goes back to Subscription', async (_, entitlement) => {
  mockEntitlement = entitlement;
  const tree = await renderWinback();
  expect(allText(tree)).not.toContain(en.subscription.winback.title);
  expect(buttonWithTitle(tree, en.subscription.expired.resubscribe)).toBeUndefined();
  expect(router.replace).toHaveBeenCalledWith('/profile/subscription');
  expect(getOfferings).not.toHaveBeenCalled();
});
