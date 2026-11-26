// Subscription screen (PHASE2_ROWS.md row 15).
//
// useEntitlement() reads only the on-device RevenueCat SDK cache, which can
// disagree with a refund or chargeback the webhook already recorded
// server-side. This pins the cross-check: when GET /api/subscription has an
// opinion, the screen shows THAT, not just RevenueCat's; when the server
// errs, the screen falls back to RevenueCat's own read without crashing and
// without showing a fabricated state. Manage subscription shows a busy button
// while the Apple page opens and reports a failure instead of swallowing it;
// Restore Purchases is busy while the store restore runs. Manage subscription
// is an Apple page, so it shows on iOS only. An expired plan (Row 8) says
// what ended and what the user keeps; Apple's page cannot restart it, so
// Manage subscription is hidden. Expired and cancelled plans show one
// Resubscribe, which opens the win back screen.
import { Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { showToast } from '@/components/display/toastStore';
import { APPLE_SUBSCRIPTIONS_URL } from '@/lib/billing/subscriptionLinks';
import { __setPurchasesModule, setDevEntitled, type CustomerInfo, type PurchasesModule } from '@/lib/billing/purchases';
import en from '@/lib/i18n/locales/en.json';
import { useSettingsStore } from '@/lib/settings/store';
import SubscriptionScreen from '@/app/profile/subscription';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { act, allText, buttonWithTitle, renderScreen, screenTitle } from './helpers';

jest.mock('@/components/display/toastStore', () => ({ showToast: jest.fn() }));
jest.mock('@/lib/purchases/revenuecat', () => {
  throw new Error('Subscription must not load the purchases wrapper');
});

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });
const ACTIVE = { status: 'active', is_active: true, platform: 'ios', plan_interval: 'year', expires_at: null };

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

// No RevenueCat key in tests, so the billing seam warns once that it runs in
// billing-disabled dev mode. Swallow only that, and fail on any other warning.
let warn: jest.SpyInstance;

beforeEach(() => {
  useSettingsStore.getState().reset();
  jest.mocked(showToast).mockClear();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  for (const [message] of warn.mock.calls) expect(message).toMatch(/^RevenueCat unavailable/);
  jest.restoreAllMocks();
});

test("shows the server's entitlement, correcting what RevenueCat alone would say", async () => {
  // RevenueCat's own (dev-mode) read says NOT entitled.
  setDevEntitled(false);
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
    url.includes('/api/subscription')
      ? json(ACTIVE)
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

describe('Manage subscription', () => {
  const renderEntitled = async () => {
    setDevEntitled(true);
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
      url.includes('/api/subscription') ? json(ACTIVE) : json({}),
    );
    const tree = render();
    await settle();
    return tree;
  };
  const press = (tree: Awaited<ReturnType<typeof renderEntitled>>, title = 'Manage subscription') =>
    act(async () => {
      (buttonWithTitle(tree, title)!.props.onPress as () => void)();
    });

  test('the button is busy while the Apple page opens, then idle again', async () => {
    let finish!: () => void;
    jest.spyOn(Linking, 'openURL').mockReturnValue(
      new Promise<void>((r) => {
        finish = r;
      }),
    );
    const tree = await renderEntitled();
    expect(buttonWithTitle(tree, 'Manage subscription')!.props.loading).toBe(false);

    await press(tree);
    expect(buttonWithTitle(tree, 'Manage subscription')!.props.loading).toBe(true);

    await act(async () => finish());
    expect(buttonWithTitle(tree, 'Manage subscription')!.props.loading).toBe(false);
  });

  test('a failure to open the page shows the error toast', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('cannot open'));
    const tree = await renderEntitled();
    await press(tree);
    expect(showToast).toHaveBeenCalledWith({ message: en.profile.manageSubscriptionFailed, tone: 'error' });
    expect(buttonWithTitle(tree, 'Manage subscription')!.props.loading).toBe(false);
  });

  test.each([
    ['ios', true],
    ['android', false],
  ] as const)('on %s an entitled user sees Manage subscription: %s', async (os, shown) => {
    jest.replaceProperty(Platform, 'OS', os);
    const tree = await renderEntitled();
    expect(buttonWithTitle(tree, 'Manage subscription') !== undefined).toBe(shown);
    expect(buttonWithTitle(tree, 'Restore Purchases')).toBeDefined();
  });

  test('a successful open shows no error', async () => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const tree = await renderEntitled();
    await press(tree);
    expect(Linking.openURL).toHaveBeenCalledWith(APPLE_SUBSCRIPTIONS_URL);
    expect(showToast).not.toHaveBeenCalled();
  });

  test('Restore Purchases is busy while the store restore runs, then idle again', async () => {
    const info: CustomerInfo = { entitlements: { active: {} } };
    let finish!: () => void;
    const store: PurchasesModule = {
      configure: () => {},
      logIn: async () => ({ customerInfo: info }),
      logOut: async () => info,
      getCustomerInfo: async () => info,
      restorePurchases: () =>
        new Promise((r) => {
          finish = () => r(info);
        }),
      addCustomerInfoUpdateListener: () => {},
    };
    __setPurchasesModule(store);
    try {
      const tree = await renderEntitled();
      expect(buttonWithTitle(tree, 'Restore Purchases')!.props.loading).toBe(false);

      await press(tree, 'Restore Purchases');
      expect(buttonWithTitle(tree, 'Restore Purchases')!.props.loading).toBe(true);

      await act(async () => finish());
      expect(buttonWithTitle(tree, 'Restore Purchases')!.props.loading).toBe(false);
    } finally {
      __setPurchasesModule(null);
    }
  });
});

describe('Expired plan', () => {
  const buttonsWithTitle = (tree: ReturnType<typeof render>, title: string) =>
    tree.root.findAll((n) => n.props.title === title && typeof n.props.onPress === 'function');
  const renderStatus = async (status: string, isActive: boolean) => {
    setDevEntitled(false);
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) =>
      url.includes('/api/subscription') ? json({ ...ACTIVE, status, is_active: isActive }) : json({}),
    );
    const tree = render();
    await settle();
    return tree;
  };

  test('says the plan ended and the data stays, and Resubscribe opens the win back screen', async () => {
    const tree = await renderStatus('expired', false);
    expect(allText(tree)).toContain(en.subscription.expired.body);
    expect(buttonWithTitle(tree, en.subscription.manage)).toBeUndefined();
    expect(buttonWithTitle(tree, en.subscription.seePlans)).toBeUndefined();

    await act(async () => {
      (buttonWithTitle(tree, en.subscription.expired.resubscribe)!.props.onPress as () => void)();
    });
    expect(router.push).toHaveBeenCalledWith('/profile/winback');
  });

  test.each([
    ['expired', false, true],
    ['cancelled', true, true],
    ['active', true, false],
    ['trialing', true, false],
    ['none', false, false],
  ] as const)('a %s plan shows the win back link: %s', async (status, isActive, shown) => {
    const tree = await renderStatus(status, isActive);
    expect(screenTitle(tree)).toBe(en.settings.subscription);
    const links = buttonsWithTitle(tree, en.subscription.expired.resubscribe);
    expect(links).toHaveLength(shown ? 1 : 0);
    if (!shown) return;
    await act(async () => {
      (links[0].props.onPress as () => void)();
    });
    expect(router.push).toHaveBeenCalledWith('/profile/winback');
  });

  test.each(['active', 'trialing'])('a %s plan keeps Manage subscription and shows no expired state', async (status) => {
    const tree = await renderStatus(status, true);
    expect(allText(tree)).toContain(en.subscription.activeBody);
    expect(allText(tree)).not.toContain(en.subscription.expired.body);
    expect(buttonWithTitle(tree, en.subscription.expired.resubscribe)).toBeUndefined();
    expect(buttonWithTitle(tree, en.subscription.manage)).toBeDefined();
  });
});
