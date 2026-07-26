// RevenueCat seam. react-native-purchases is a NATIVE module: it cannot run in
// Expo Go, and the key arrives later — so all access goes through this seam,
// which (a) reads EXPO_PUBLIC_REVENUECAT_IOS_KEY, (b) lazy-requires the SDK only
// when a key exists and the native module loads, and (c) otherwise runs in
// "billing-disabled" dev mode: entitlement is a dev flag (default: entitled, so
// the whole app stays usable in Expo Go). Tests inject a mock via
// __setPurchasesModule — same pattern as lib/health/appleHealth.

import { isDevBuild } from '@/lib/env';

export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

/** The 'pro' entitlement identifier configured in the RevenueCat dashboard. */
export const PRO_ENTITLEMENT = 'pro';

// Minimal surface of react-native-purchases the app uses.
export type CustomerInfo = { entitlements: { active: Record<string, unknown> } };
export type PurchasesModule = {
  configure(opts: { apiKey: string }): void;
  logIn(appUserID: string): Promise<{ customerInfo: CustomerInfo }>;
  logOut(): Promise<CustomerInfo>;
  getCustomerInfo(): Promise<CustomerInfo>;
  restorePurchases(): Promise<CustomerInfo>;
  addCustomerInfoUpdateListener(listener: (info: CustomerInfo) => void): void;
};

let purchasesModule: PurchasesModule | null = null;
let configured = false;
let warned = false;
// True when a module was injected (__setPurchasesModule) — injection is explicit
// intent, so billing is treated as enabled without the env key (tests, future
// custom wiring).
let injected = false;

// Dev-mode entitlement flag (billing-disabled only). Default true so the app is
// fully usable in Expo Go without keys.
let devEntitled = true;
const devListeners = new Set<(entitled: boolean) => void>();

/** Inject a mock module (tests) or the real one (future). Resets configure state. */
export function __setPurchasesModule(m: PurchasesModule | null): void {
  purchasesModule = m;
  injected = m !== null;
  configured = false;
}

// loadModule lazy-requires the native SDK. Guarded: in Expo Go (no native
// module) the require or first call throws — we degrade to disabled mode.
function loadModule(): PurchasesModule | null {
  if (purchasesModule) return purchasesModule;
  if (!REVENUECAT_IOS_KEY) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional native module; static import would crash Expo Go
    const mod = require('react-native-purchases');
    purchasesModule = (mod.default ?? mod) as PurchasesModule;
    return purchasesModule;
  } catch {
    return null;
  }
}

/** True when billing can actually run: a module was injected, or the key is
 *  present AND the native module loaded. */
export function isBillingEnabled(): boolean {
  const enabled = injected || (REVENUECAT_IOS_KEY.length > 0 && loadModule() !== null);
  if (!enabled && !warned) {
    warned = true;
    console.warn('RevenueCat unavailable (no key or no native module) — running in billing-disabled dev mode.');
  }
  return enabled;
}

/** Initialize the SDK once (root layout, after Clerk is ready). No-op when disabled. */
export function configurePurchases(): void {
  if (configured) return;
  const mod = loadModule();
  if (!mod || !isBillingEnabled()) return;
  try {
    mod.configure({ apiKey: REVENUECAT_IOS_KEY });
    configured = true;
  } catch {
    // Native side unavailable (Expo Go) — stay in disabled mode.
  }
}

/** Tie RevenueCat identity to the Clerk user (null → logOut). Best-effort. */
export async function onAuthUserChanged(clerkUserId: string | null): Promise<void> {
  const mod = loadModule();
  if (!mod || !isBillingEnabled()) return;
  try {
    if (clerkUserId) await mod.logIn(clerkUserId);
    else await mod.logOut();
  } catch {
    // Identity sync is best-effort; entitlement checks still work anonymously.
  }
}

/** Current customer info, or null in disabled mode / on failure. */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  const mod = loadModule();
  if (!mod || !isBillingEnabled()) return null;
  try {
    return await mod.getCustomerInfo();
  } catch {
    return null;
  }
}

/** Restore purchases. Returns the refreshed info, or null when disabled/failed. */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  const mod = loadModule();
  if (!mod || !isBillingEnabled()) return null;
  return mod.restorePurchases(); // let failures throw — the caller surfaces them
}

/** Subscribe to entitlement-relevant updates (live customerInfo in real mode,
 *  the dev flag in disabled mode). Returns an unsubscribe. */
export function subscribeCustomerInfo(listener: (info: CustomerInfo | null) => void): () => void {
  const mod = loadModule();
  if (mod && isBillingEnabled()) {
    try {
      mod.addCustomerInfoUpdateListener(listener);
    } catch {
      // listener registration is best-effort
    }
    return () => {}; // the SDK keeps listeners for the process lifetime
  }
  const devListener = () => listener(null);
  devListeners.add(devListener as never);
  return () => devListeners.delete(devListener as never);
}

/** Pure: does this customer info carry the pro entitlement? */
export function hasProEntitlement(info: CustomerInfo | null): boolean {
  return info != null && PRO_ENTITLEMENT in info.entitlements.active;
}

// --- RevenueCat hosted paywall (react-native-purchases-ui) --------------------

export type PaywallOutcome = 'purchased' | 'restored' | 'cancelled' | 'error' | 'unavailable';

// Minimal surface of react-native-purchases-ui.
type PurchasesUIModule = {
  presentPaywall(): Promise<string>; // PAYWALL_RESULT enum value
};

let uiModule: PurchasesUIModule | null = null;

/** Inject a mock paywall UI module (tests). */
export function __setPurchasesUIModule(m: PurchasesUIModule | null): void {
  uiModule = m;
}

function loadUIModule(): PurchasesUIModule | null {
  if (uiModule) return uiModule; // injected (tests) or already loaded
  if (!REVENUECAT_IOS_KEY) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional native module; static import would crash Expo Go
    const mod = require('react-native-purchases-ui');
    uiModule = (mod.default ?? mod) as PurchasesUIModule;
    return uiModule;
  } catch {
    return null;
  }
}

/** Present RevenueCat's hosted paywall for the current (default) offering.
 *  'unavailable' in billing-disabled dev mode — the caller shows its dev state.
 *  A loaded module (injected, or lazy-required behind the key) is sufficient. */
export async function presentPaywall(): Promise<PaywallOutcome> {
  const mod = loadUIModule();
  if (!mod) return 'unavailable';
  try {
    const result = await mod.presentPaywall();
    switch (result) {
      case 'PURCHASED':
        return 'purchased';
      case 'RESTORED':
        return 'restored';
      case 'CANCELLED':
      case 'NOT_PRESENTED':
        return 'cancelled';
      default:
        return 'error';
    }
  } catch {
    return 'error';
  }
}

/** Dev flag (billing-disabled mode only). In a RELEASE build with no key this
 *  is a packaging mistake, not dev mode — never silently grant entitlement. */
export function isDevEntitled(): boolean {
  return isDevBuild() && devEntitled;
}

/** Flip the dev entitlement flag (dev tooling/tests). Notifies subscribers. */
export function setDevEntitled(entitled: boolean): void {
  devEntitled = entitled;
  for (const l of devListeners) (l as (e: boolean) => void)(entitled);
}
