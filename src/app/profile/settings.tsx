// E2 · Settings list
// Apple-style grouped settings. Order: Account, Subscription, Goals, Preferences,
// Notifications, Apple Health, Privacy, Support, About.
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <Screen grouped title={t('settings.title')} showBack>
      <SettingsList
        title={t('settings.groupAccount')}
        rows={[
          { icon: 'person-outline', label: t('settings.account'), onPress: () => router.push('/profile/account') },
          { icon: 'card-outline', label: t('settings.subscription'), onPress: () => router.push('/profile/subscription') },
          { icon: 'flag-outline', label: t('settings.goals'), onPress: () => router.push('/profile/goals') },
        ]}
      />
      <SettingsList
        title={t('settings.groupApp')}
        rows={[
          { icon: 'options-outline', label: t('settings.preferences'), onPress: () => router.push('/profile/preferences') },
          { icon: 'notifications-outline', label: t('settings.notifications'), onPress: () => router.push('/profile/notifications') },
          { icon: 'heart-outline', label: t('settings.appleHealth'), onPress: () => router.push('/profile/apple-health') },
        ]}
      />
      <SettingsList
        title={t('settings.groupAbout')}
        rows={[
          { icon: 'shield-checkmark-outline', label: t('settings.privacy'), onPress: () => router.push('/profile/privacy') },
          { icon: 'help-circle-outline', label: t('settings.support'), onPress: () => router.push('/profile/support') },
          { icon: 'information-circle-outline', label: t('settings.about'), onPress: () => router.push('/profile/about') },
        ]}
      />
    </Screen>
  );
}
