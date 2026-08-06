// E2 · Settings list
// Apple-style grouped settings. Order: Account, Subscription, Goals, Preferences,
// Notifications, Privacy, Support, About, then Sign out / Delete account.
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { showToast } from '@/components/display/toastStore';
import { hasProEntitlement, isBillingEnabled, restorePurchases } from '@/lib/billing/purchases';
import { useAppState } from '@/lib/auth/appState';
import { router, type Href } from 'expo-router';
import { isDevBuild } from '@/lib/env';

// Restore Purchases (Apple requires this for any app with IAP). Result via toast.
// Guards against a double tap: the row has no busy state, so without this a
// second tap fires a second StoreKit restore whose result races the first and
// can leave the user reading "Subscription restored" followed by "No purchases
// to restore" for the same account.
let restoring = false;

async function restore(): Promise<void> {
  if (restoring) return;
  if (!isBillingEnabled()) {
    showToast({
      message: isDevBuild()
        ? 'Billing not configured (dev).'
        : 'Purchases are temporarily unavailable. Please try again later.',
      tone: 'info',
    });
    return;
  }
  restoring = true;
  try {
    const info = await restorePurchases();
    showToast({
      message: hasProEntitlement(info) ? 'Subscription restored.' : 'No purchases to restore.',
      tone: hasProEntitlement(info) ? 'success' : 'info',
    });
  } catch {
    showToast({ message: "Couldn't reach the store — try again later.", tone: 'error' });
  } finally {
    restoring = false;
  }
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { dispatch } = useAppState();

  // SIGN_OUT → machine purges every store + offline queue, ends the Clerk
  // session (signOutSeam), RevenueCat identity resets via the bridge.
  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Your data stays in your account — sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => dispatch({ type: 'SIGN_OUT' }) },
    ]);
  };

  return (
    <Screen grouped title={t('settings.title')} showBack>
      <SettingsList
        title={t('settings.groupAccount')}
        rows={[
          { icon: 'person-outline', label: t('settings.account'), onPress: () => router.push('/profile/account') },
          { icon: 'card-outline', label: t('settings.subscription'), onPress: () => router.push('/profile/subscription') },
          { icon: 'refresh-outline', label: 'Restore Purchases', onPress: () => void restore() },
          { icon: 'flag-outline', label: t('settings.goals'), onPress: () => router.push('/profile/goals') },
          { icon: 'options-outline', label: t('settings.scanAccuracy'), onPress: () => router.push('/profile/scan-calibration' as Href) },
          { icon: 'sparkles-outline', label: 'AI insights', onPress: () => router.push('/insights' as Href) },
        ]}
      />
      <SettingsList
        title={t('settings.groupApp')}
        rows={[
          { icon: 'options-outline', label: t('settings.preferences'), onPress: () => router.push('/profile/preferences') },
          // Notifications row removed (audit 2026-08-06): the preferences
          // screen offered "What we send" toggles + quiet hours for a
          // notification system that does not exist in the build — dead UI
          // masquerading as a feature (App Store 2.1). Restore the row when
          // something actually sends notifications.
          { icon: 'link-outline', label: 'Connected apps', onPress: () => router.push('/profile/integrations' as Href) },
        ]}
      />
      <SettingsList
        title={t('settings.groupAbout')}
        rows={[
          { icon: 'shield-checkmark-outline', label: t('settings.privacy'), onPress: () => router.push('/profile/privacy') },
          { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => router.push('/legal/terms' as Href) },
          { icon: 'lock-closed-outline', label: 'Privacy Policy', onPress: () => router.push('/legal/privacy' as Href) },
          { icon: 'help-circle-outline', label: t('settings.support'), onPress: () => router.push('/profile/support') },
          { icon: 'information-circle-outline', label: t('settings.about'), onPress: () => router.push('/profile/about') },
        ]}
      />
      <SettingsList
        rows={[
          { icon: 'log-out-outline', label: 'Sign out', onPress: confirmSignOut },
          {
            icon: 'trash-outline',
            label: 'Delete my account',
            destructive: true,
            onPress: () => router.push('/profile/delete-account'),
          },
        ]}
      />
    </Screen>
  );
}
