// Clerk + RevenueCat wiring — logic tests (no rendering).
import {
  api,
  ApiError,
  setAuthTokenProvider,
  setTokenRefreshHandler,
  setUnauthorizedHandler,
} from '@/lib/api';
import { transition } from '@/lib/auth/machine';
import { registerSignOutExecutor, executeSignOut } from '@/lib/auth/signOutSeam';
import { isClerkEnabled, clerkTokenCache } from '@/lib/auth/clerkEnv';
import {
  __setPurchasesModule,
  __setPurchasesUIModule,
  hasProEntitlement,
  isBillingEnabled,
  isDevEntitled,
  setDevEntitled,
  onAuthUserChanged,
  presentPaywall,
  restorePurchases,
  getCustomerInfo,
  TRIAL_DAYS,
  type CustomerInfo,
  type PurchasesModule,
} from '@/lib/billing/purchases';

// --- helpers -----------------------------------------------------------------

type FetchCall = { url: string; init: RequestInit };
function mockFetchSequence(statuses: number[]): { calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  let i = 0;
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string, init?: RequestInit) => {
    calls.push({ url, init: init ?? {} });
    const status = statuses[Math.min(i++, statuses.length - 1)];
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: async () => (status < 300 ? { data: { id: 'row' }, error: null } : { data: null, error: 'unauthorized' }),
    });
  });
  return { calls };
}

function mockPurchases(active: string[] = []): PurchasesModule & { log: string[] } {
  const info: CustomerInfo = { entitlements: { active: Object.fromEntries(active.map((e) => [e, {}])) } };
  const log: string[] = [];
  return {
    log,
    configure: () => log.push('configure'),
    logIn: async (id: string) => {
      log.push(`logIn:${id}`);
      return { customerInfo: info };
    },
    logOut: async () => {
      log.push('logOut');
      return info;
    },
    getCustomerInfo: async () => info,
    restorePurchases: async () => {
      log.push('restore');
      return info;
    },
    addCustomerInfoUpdateListener: () => {},
  };
}

afterEach(() => {
  setAuthTokenProvider(() => Promise.resolve(null));
  setTokenRefreshHandler(null);
  setUnauthorizedHandler(() => {});
  registerSignOutExecutor(null);
  __setPurchasesModule(null);
  __setPurchasesUIModule(null);
  setDevEntitled(true);
  jest.restoreAllMocks();
});

// --- A7: Clerk auth wiring ----------------------------------------------------

describe('clerk-absent dev mode', () => {
  test('no key → clerk disabled, app treats user as local dev session', () => {
    // Test env has no EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.
    expect(isClerkEnabled()).toBe(false);
  });

  test('token provider is null in dev mode → no Authorization header', async () => {
    const { calls } = mockFetchSequence([200]);
    await api.goals.get();
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  test('token cache round-trips through secure-store', async () => {
    await clerkTokenCache.saveToken('clerk_jwt_test', 'tok-abc');
    expect(await clerkTokenCache.getToken('clerk_jwt_test')).toBe('tok-abc');
  });
});

describe('token provider (Clerk seam)', () => {
  test('returns the Clerk token when present', async () => {
    setAuthTokenProvider(() => Promise.resolve('clerk-token'));
    const { calls } = mockFetchSequence([200]);
    await api.goals.get();
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer clerk-token');
  });
});

describe('401 → refresh → retry → sign-out-on-failure', () => {
  test('401 with a working refresh retries once with the fresh token and succeeds', async () => {
    setAuthTokenProvider(() => Promise.resolve('stale'));
    setTokenRefreshHandler(() => Promise.resolve('fresh'));
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    const { calls } = mockFetchSequence([401, 200]);

    const result = await api.goals.get();
    expect(result).toEqual({ id: 'row' });
    expect(calls).toHaveLength(2);
    expect((calls[1].init.headers as Record<string, string>).Authorization).toBe('Bearer fresh');
    expect(onUnauthorized).not.toHaveBeenCalled(); // recovered — no sign-out
  });

  test('401 twice (refresh did not help) → unauthorized handler fires once', async () => {
    setAuthTokenProvider(() => Promise.resolve('stale'));
    setTokenRefreshHandler(() => Promise.resolve('still-bad'));
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetchSequence([401, 401]);

    await expect(api.goals.get()).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test('refresh returning null → no retry, unauthorized handler fires', async () => {
    setTokenRefreshHandler(() => Promise.resolve(null));
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    const { calls } = mockFetchSequence([401]);

    await expect(api.goals.get()).rejects.toBeInstanceOf(ApiError);
    expect(calls).toHaveLength(1); // no retry without a fresh token
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test('machine path: UNAUTHORIZED → expired(refresh) → REFRESH_FAILED signs out', () => {
    const t1 = transition('signedIn', { type: 'UNAUTHORIZED' });
    expect(t1.state).toBe('expired');
    expect(t1.effects).toEqual(['refreshToken']);
    const t2 = transition(t1.state, { type: 'REFRESH_FAILED' });
    expect(t2.state).toBe('signedOut');
    expect(t2.effects).toEqual(expect.arrayContaining(['purgeAllState', 'route:signIn']));
  });
});

describe('sign-out executor seam', () => {
  test('executeSignOut invokes the registered Clerk signOut', async () => {
    const clerkSignOut = jest.fn(() => Promise.resolve());
    registerSignOutExecutor(clerkSignOut);
    await executeSignOut();
    expect(clerkSignOut).toHaveBeenCalledTimes(1);
  });

  test('executor failure never throws; unregistered is a no-op', async () => {
    registerSignOutExecutor(() => Promise.reject(new Error('network')));
    await expect(executeSignOut()).resolves.toBeUndefined();
    registerSignOutExecutor(null);
    await expect(executeSignOut()).resolves.toBeUndefined();
  });
});

// --- B6: RevenueCat wiring ----------------------------------------------------

describe('billing-disabled dev mode', () => {
  test('no key → billing disabled, dev flag is the entitlement (default true)', () => {
    expect(isBillingEnabled()).toBe(false);
    expect(isDevEntitled()).toBe(true);
    setDevEntitled(false);
    expect(isDevEntitled()).toBe(false);
  });

  test('customer info + restore degrade to null (no crash)', async () => {
    expect(await getCustomerInfo()).toBeNull();
    expect(await restorePurchases()).toBeNull();
  });
});

describe('entitlement logic', () => {
  test('hasProEntitlement true only when "pro" is active', () => {
    expect(hasProEntitlement({ entitlements: { active: { pro: {} } } })).toBe(true);
    expect(hasProEntitlement({ entitlements: { active: { other: {} } } })).toBe(false);
    expect(hasProEntitlement({ entitlements: { active: {} } })).toBe(false);
    expect(hasProEntitlement(null)).toBe(false);
  });
});

describe('RevenueCat identity ties to the Clerk user', () => {
  test('sign-in calls Purchases.logIn with the Clerk user id; sign-out calls logOut', async () => {
    const mod = mockPurchases(['pro']);
    __setPurchasesModule(mod); // injection ⇒ billing enabled (explicit intent)
    await onAuthUserChanged('user_clerk_1');
    await onAuthUserChanged(null);
    expect(mod.log).toEqual(['logIn:user_clerk_1', 'logOut']);
  });

  test('restore surfaces the refreshed customer info; getCustomerInfo works', async () => {
    const mod = mockPurchases(['pro']);
    __setPurchasesModule(mod);
    expect(hasProEntitlement(await getCustomerInfo())).toBe(true);
    const restored = await restorePurchases();
    expect(hasProEntitlement(restored)).toBe(true);
    expect(mod.log).toContain('restore');
  });

  test('restore failure propagates (the caller surfaces the error toast)', async () => {
    const mod = mockPurchases();
    mod.restorePurchases = async () => {
      throw new Error('store unreachable');
    };
    __setPurchasesModule(mod);
    await expect(restorePurchases()).rejects.toThrow('store unreachable');
  });
});

describe('hosted paywall outcome mapping', () => {
  const present = async (result: string) => {
    __setPurchasesUIModule({ presentPaywall: async () => result });
    return presentPaywall();
  };

  test('maps every PAYWALL_RESULT onto the app outcome', async () => {
    expect(await present('PURCHASED')).toBe('purchased');
    expect(await present('RESTORED')).toBe('restored');
    expect(await present('CANCELLED')).toBe('cancelled');
    expect(await present('NOT_PRESENTED')).toBe('cancelled');
    expect(await present('SOMETHING_ELSE')).toBe('error');
  });

  test('a throwing paywall maps to error, never an unhandled rejection', async () => {
    __setPurchasesUIModule({
      presentPaywall: async () => {
        throw new Error('native crash');
      },
    });
    expect(await presentPaywall()).toBe('error');
  });

  test('unavailable with no module and no key (Expo Go dev mode)', async () => {
    __setPurchasesUIModule(null);
    expect(await presentPaywall()).toBe('unavailable');
  });
});

// --- Trial length: one number, every surface ---------------------------------
// A mismatch between displayed and charged terms is an App Store 3.1.2
// rejection and a chargeback risk, so every user-facing mention of the trial
// must derive from TRIAL_DAYS rather than hardcoding a number.
describe('trial length consistency', () => {
  const read = (p: string) => require('fs').readFileSync(require('path').join(__dirname, '..', '..', p), 'utf8');

  test('TRIAL_DAYS is the single source of truth and matches the documented dashboard value', () => {
    expect(TRIAL_DAYS).toBe(7);
    // CONFIG.md tells the operator what to set in the RevenueCat dashboard.
    expect(read('CONFIG.md')).toContain(`${TRIAL_DAYS}-day trial`);
  });

  test('no in-app surface hardcodes a trial length', () => {
    for (const f of [
      'src/app/onboarding/paywall.tsx',
      'src/app/onboarding/preview.tsx',
      'src/app/legal/terms.tsx',
    ]) {
      const src = read(f);
      expect(src).toContain('TRIAL_DAYS');
      // No literal "<n>-day ... trial" copy that could drift from the constant.
      expect(src).not.toMatch(/\d+-day free trial/);
      expect(src).not.toMatch(/Free \d+-day trial/);
    }
  });
});
