// Apple's own subscription management page. Deleting an account does not cancel
// an App Store subscription, so screens send the user here to cancel it.
import { Linking, Platform } from 'react-native';

export const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

/** Opens Apple's subscription settings; false when the link could not open. */
export async function openManageSubscription(): Promise<boolean> {
  try {
    await Linking.openURL(APPLE_SUBSCRIPTIONS_URL);
    return true;
  } catch {
    return false;
  }
}

/** Apple's page manages App Store subscriptions only, so the button is iOS only. */
export function isManageSubscriptionAvailable(): boolean {
  return Platform.OS === 'ios';
}
