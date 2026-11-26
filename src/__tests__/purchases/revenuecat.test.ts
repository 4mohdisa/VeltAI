// src/lib/purchases/revenuecat.ts against a fake react-native-purchases (no
// network, no native module). The key is a placeholder set per test; modules
// are loaded fresh so the billing seam reads it.
import type * as Wrapper from '@/lib/purchases/revenuecat';

const KEY = 'EXPO_PUBLIC_REVENUECAT_IOS_KEY';

const monthly = {
  identifier: '$rc_monthly',
  product: { identifier: 'lume_pro_monthly', priceString: '$9.99', subscriptionPeriod: 'P1M' },
};
const annual = {
  identifier: '$rc_annual',
  product: { identifier: 'lume_pro_annual', priceString: '$59.99', subscriptionPeriod: 'P1Y' },
};

const pro = (over: Partial<{ isActive: boolean; willRenew: boolean; periodType: string; billingIssueDetectedAt: string | null }>) => ({
  entitlements: {
    active: {},
    all: { pro: { isActive: true, willRenew: true, periodType: 'NORMAL', billingIssueDetectedAt: null, ...over } },
  },
});
const noEntitlement = { entitlements: { active: {}, all: {} } };

const mockSdk = {
  configure: jest.fn(),
  logIn: jest.fn(async () => ({ customerInfo: noEntitlement })),
  logOut: jest.fn(async () => noEntitlement),
  getCustomerInfo: jest.fn(async (): Promise<unknown> => noEntitlement),
  restorePurchases: jest.fn(async (): Promise<unknown> => noEntitlement),
  addCustomerInfoUpdateListener: jest.fn(),
  getOfferings: jest.fn(async () => ({ current: { identifier: 'default', availablePackages: [monthly, annual] }, all: {} })),
  purchasePackage: jest.fn(async (): Promise<unknown> => ({ customerInfo: pro({}) })),
  checkTrialOrIntroductoryPriceEligibility: jest.fn(async (): Promise<Record<string, { status: number }>> => ({})),
};

jest.mock('react-native-purchases', () => ({ __esModule: true, default: mockSdk }));

function load(withKey = true): typeof Wrapper {
  if (withKey) process.env[KEY] = 'test_placeholder';
  else delete process.env[KEY];
  let mod: typeof Wrapper | undefined;
  jest.isolateModules(() => {
    mod = jest.requireActual('@/lib/purchases/revenuecat');
  });
  return mod!;
}

const ELIGIBLE = 2;
const INELIGIBLE = 1;

let warn: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
  delete process.env[KEY];
});

describe('not configured (no key)', () => {
  test('every call reports the not configured state and never throws', async () => {
    const rc = load(false);
    await expect(rc.configure('user_1')).resolves.toBe('not_configured');
    await expect(rc.getOfferings()).resolves.toEqual([]);
    await expect(
      rc.purchasePackage({ identifier: 'x', productId: 'x', priceString: '', periodLabel: '', trialEligible: false }),
    ).resolves.toEqual({ kind: 'error', code: 'not_configured' });
    await expect(rc.restorePurchases()).resolves.toBe('none');
    await expect(rc.getEntitlementState()).resolves.toBe('none');
    expect(mockSdk.configure).not.toHaveBeenCalled();
  });
});

describe('configured', () => {
  test('configure sets up the SDK and logs the user in', async () => {
    const rc = load();
    await expect(rc.configure('user_1')).resolves.toBe('configured');
    expect(mockSdk.configure).toHaveBeenCalledWith({ apiKey: 'test_placeholder' });
    expect(mockSdk.logIn).toHaveBeenCalledWith('user_1');
  });

  test('offerings carry the store price string and a period label', async () => {
    const rc = load();
    const [offering] = await rc.getOfferings();
    expect(offering.identifier).toBe('default');
    expect(offering.packages).toEqual([
      { identifier: '$rc_monthly', productId: 'lume_pro_monthly', priceString: '$9.99', periodLabel: 'Monthly', trialEligible: false },
      { identifier: '$rc_annual', productId: 'lume_pro_annual', priceString: '$59.99', periodLabel: 'Yearly', trialEligible: false },
    ]);
    expect(mockSdk.checkTrialOrIntroductoryPriceEligibility).toHaveBeenCalledWith(['lume_pro_monthly', 'lume_pro_annual']);
  });

  test('a package the store says is trial eligible is marked eligible', async () => {
    mockSdk.checkTrialOrIntroductoryPriceEligibility.mockResolvedValueOnce({
      lume_pro_monthly: { status: ELIGIBLE },
      lume_pro_annual: { status: ELIGIBLE },
    });
    const rc = load();
    const [offering] = await rc.getOfferings();
    expect(offering.packages.map((p) => p.trialEligible)).toEqual([true, true]);
  });

  test('a package the store says is not eligible, or a failed check, shows no trial', async () => {
    mockSdk.checkTrialOrIntroductoryPriceEligibility.mockResolvedValueOnce({
      lume_pro_monthly: { status: INELIGIBLE },
    });
    const rc = load();
    const [offering] = await rc.getOfferings();
    expect(offering.packages.map((p) => p.trialEligible)).toEqual([false, false]);

    mockSdk.checkTrialOrIntroductoryPriceEligibility.mockRejectedValueOnce(new Error('store down'));
    const [again] = await rc.getOfferings();
    expect(again.packages.map((p) => p.trialEligible)).toEqual([false, false]);
  });

  test('purchase success', async () => {
    const rc = load();
    const [offering] = await rc.getOfferings();
    await expect(rc.purchasePackage(offering.packages[0])).resolves.toEqual({ kind: 'purchased' });
    expect(mockSdk.purchasePackage).toHaveBeenCalledWith(monthly);
  });

  test('the user cancelling the purchase is cancelled', async () => {
    mockSdk.purchasePackage.mockRejectedValueOnce({ userCancelled: true, code: '1' });
    const rc = load();
    const [offering] = await rc.getOfferings();
    await expect(rc.purchasePackage(offering.packages[0])).resolves.toEqual({ kind: 'cancelled' });
  });

  test('any other purchase error is an error with its code', async () => {
    mockSdk.purchasePackage.mockRejectedValueOnce({ userCancelled: false, code: '2' });
    const rc = load();
    const [offering] = await rc.getOfferings();
    await expect(rc.purchasePackage(offering.packages[0])).resolves.toEqual({ kind: 'error', code: '2' });
  });

  test('restore returns the restored entitlement state', async () => {
    mockSdk.restorePurchases.mockResolvedValueOnce(pro({}));
    const rc = load();
    await expect(rc.restorePurchases()).resolves.toBe('active');
    expect(mockSdk.restorePurchases).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['trial', pro({ periodType: 'TRIAL' })],
    ['active', pro({})],
    ['billing_issue', pro({ billingIssueDetectedAt: '2026-11-20T00:00:00Z' })],
    ['cancelled_active', pro({ willRenew: false })],
    ['expired', pro({ isActive: false })],
    ['none', noEntitlement],
  ])('entitlement state %s', async (state, info) => {
    mockSdk.getCustomerInfo.mockResolvedValueOnce(info);
    const rc = load();
    await expect(rc.getEntitlementState()).resolves.toBe(state);
  });
});
