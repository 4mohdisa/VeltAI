// Paywall-on-402 — the client half of the server-side entitlement gate
// (backend/internal/entitlement). The SERVER decides; this only reacts, so a
// tampered client can skip the prompt but still cannot use the feature.
import { ApiError } from '@/lib/api';
import { showToast } from '@/components/display/toastStore';
import { isBillingEnabled, presentPaywall } from './purchases';

/** True when this error is the backend refusing a Pro feature. */
export function isUpgradeRequired(e: unknown): e is ApiError {
  return e instanceof ApiError && e.upgradeRequired;
}

/**
 * Handle a caught error that may be an entitlement refusal: presents the
 * RevenueCat paywall and returns true, or returns false when the error was
 * something else (so the caller can surface its own message).
 */
export async function handleUpgradeRequired(e: unknown): Promise<boolean> {
  if (!isUpgradeRequired(e)) return false;
  showToast({ message: e.message, tone: 'info' });
  if (isBillingEnabled()) await presentPaywall();
  return true;
}
