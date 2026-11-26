// RevenueCat for the app's own paywall: offerings with store prices, package
// purchase, restore and the entitlement state. The SDK is reached only through
// purchasesSdk() in src/lib/billing/purchases.ts, which owns the key and the
// native module. With no key or no native module every call reports the not
// configured state; nothing here throws.
import { track } from '@/lib/analytics';
import {
  configurePurchases,
  onAuthUserChanged,
  PRO_ENTITLEMENT,
  purchasesSdk,
  restorePurchases as restoreSdk,
  type CustomerInfo,
  type SdkOffering,
  type SdkPackage,
} from '@/lib/billing/purchases';
import i18n from '@/lib/i18n';

import type { EntitlementState, Offering, PurchasablePackage, PurchaseResult } from './types';

// INTRO_ELIGIBILITY_STATUS_ELIGIBLE in react-native-purchases.
const INTRO_ELIGIBLE = 2;

const NOT_CONFIGURED = 'not_configured';

// SDK packages from the last getOfferings call, by product id, so a purchase
// is made with the store's own package object.
const loadedPackages = new Map<string, SdkPackage>();

const PERIOD_UNITS: Record<string, string> = { D: 'day', W: 'week', M: 'month', Y: 'year' };

/** ISO 8601 period (P1M, P3M, P1Y) to a label; no period is a one-time product. */
function periodLabel(period: string | null): string {
  const match = period ? /^P(\d+)([DWMY])$/.exec(period) : null;
  if (!match) return i18n.t('subscription.period.oneTime');
  return i18n.t(`subscription.period.${PERIOD_UNITS[match[2]]}`, { count: Number(match[1]) });
}

/** Ties the SDK to the signed-in user. 'not_configured' without a key or native module. */
export async function configure(appUserId: string): Promise<'configured' | 'not_configured'> {
  configurePurchases();
  if (!purchasesSdk()) return NOT_CONFIGURED;
  await onAuthUserChanged(appUserId);
  return 'configured';
}

/** Every offering, the current one first. Empty when not configured or on failure. */
export async function getOfferings(): Promise<Offering[]> {
  const sdk = purchasesSdk();
  if (!sdk) return [];
  try {
    const { current, all } = await sdk.getOfferings();
    const offerings: SdkOffering[] = [
      ...(current ? [current] : []),
      ...Object.values(all).filter((o) => o.identifier !== current?.identifier),
    ];
    const sdkPackages = offerings.flatMap((o) => o.availablePackages);
    const productIds = [...new Set(sdkPackages.map((p) => p.product.identifier))];
    // A failed eligibility check means not eligible: a trial is never assumed.
    const eligibility = await sdk
      .checkTrialOrIntroductoryPriceEligibility(productIds)
      .catch((): Record<string, { status: number }> => ({}));
    loadedPackages.clear();
    for (const p of sdkPackages) loadedPackages.set(p.product.identifier, p);
    return offerings.map((o) => ({
      identifier: o.identifier,
      packages: o.availablePackages.map(
        (p): PurchasablePackage => ({
          identifier: p.identifier,
          productId: p.product.identifier,
          priceString: p.product.priceString,
          periodLabel: periodLabel(p.product.subscriptionPeriod),
          trialEligible: eligibility[p.product.identifier]?.status === INTRO_ELIGIBLE,
        }),
      ),
    }));
  } catch {
    return [];
  }
}

/** Buys a package from the last getOfferings call. The user cancelling is 'cancelled'. */
export async function purchasePackage(pkg: PurchasablePackage): Promise<PurchaseResult> {
  const sdk = purchasesSdk();
  if (!sdk) return { kind: 'error', code: NOT_CONFIGURED };
  const sdkPackage = loadedPackages.get(pkg.productId);
  if (!sdkPackage) return { kind: 'error', code: 'package_not_loaded' };
  track('purchase_started');
  try {
    await sdk.purchasePackage(sdkPackage);
    track('purchase_completed');
    return { kind: 'purchased' };
  } catch (e) {
    const err = e as { userCancelled?: boolean | null; code?: string | number };
    if (err.userCancelled) {
      track('purchase_cancelled');
      return { kind: 'cancelled' };
    }
    return { kind: 'error', code: String(err.code ?? 'unknown') };
  }
}

/** Restores purchases and returns the resulting state ('none' when not configured or on failure). */
export async function restorePurchases(): Promise<EntitlementState> {
  try {
    return entitlementStateOf(await restoreSdk());
  } catch {
    return 'none';
  }
}

/** The pro entitlement's state now ('none' when not configured or on failure). */
export async function getEntitlementState(): Promise<EntitlementState> {
  const sdk = purchasesSdk();
  if (!sdk) return 'none';
  try {
    return entitlementStateOf(await sdk.getCustomerInfo());
  } catch {
    return 'none';
  }
}

/** True for every state in which the user currently has pro access. */
export function isEntitledState(state: EntitlementState): boolean {
  return state === 'trial' || state === 'active' || state === 'billing_issue' || state === 'cancelled_active';
}

function entitlementStateOf(info: CustomerInfo | null): EntitlementState {
  const pro = info?.entitlements.all?.[PRO_ENTITLEMENT];
  if (!pro) return 'none';
  if (!pro.isActive) return 'expired';
  if (pro.billingIssueDetectedAt) return 'billing_issue';
  if (pro.periodType === 'TRIAL') return 'trial';
  return pro.willRenew ? 'active' : 'cancelled_active';
}
