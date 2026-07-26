// E2 · Settings list
// Apple-style grouped settings. Order: Account, Subscription, Goals, Preferences,
// Notifications, Apple Health, Privacy, Support, About.
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { showToast } from '@/components/display/toastStore';
import { hasProEntitlement, isBillingEnabled, restorePurchases } from '@/lib/billing/purchases';
import { router, type Href } from 'expo-router';

// Restore Purchases (Apple requires this for any app with IAP). Result via toast.
async function restore(): Promise<void> {
  if (!isBillingEnabled()) {
    showToast({ message: 'Billing not configured (dev).', tone: 'info' });
    return;
  }
  try {
    const info = await restorePurchases();
    showToast({
      message: hasProEntitlement(info) ? 'Subscription restored.' : 'No purchases to restore.',
      tone: hasProEntitlement(info) ? 'success' : 'info',
    });
  } catch {
    showToast({ message: "Couldn't reach the store — try again later.", tone: 'error' });
  }
}

export default function SettingsScreen() {
  const { t } = useTranslation();
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
          { icon: 'notifications-outline', label: t('settings.notifications'), onPress: () => router.push('/profile/notifications') },
          { icon: 'heart-outline', label: t('settings.appleHealth'), onPress: () => router.push('/profile/apple-health') },
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
