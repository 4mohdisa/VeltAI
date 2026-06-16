// E2 · Settings list
// Apple-style grouped settings: Account, Subscription, Notifications, Apple
// Health, Units, Privacy, Support, About.
import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { router } from 'expo-router';

export default function SettingsScreen() {
  return (
    <Screen title="Settings" showBack>
      <SettingsList
        title="Account"
        rows={[
          { icon: 'person-outline', label: 'Account', onPress: () => router.push('/profile/account') },
          { icon: 'card-outline', label: 'Subscription', onPress: () => router.push('/profile/subscription') },
        ]}
      />
      <SettingsList
        title="App"
        rows={[
          { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/profile/notifications') },
          { icon: 'heart-outline', label: 'Apple Health', onPress: () => router.push('/profile/apple-health') },
          { icon: 'options-outline', label: 'Units', onPress: () => router.push('/profile/units') },
        ]}
      />
      <SettingsList
        title="About"
        rows={[
          { icon: 'shield-checkmark-outline', label: 'Privacy', onPress: () => router.push('/profile/privacy') },
          { icon: 'help-circle-outline', label: 'Support', onPress: () => router.push('/profile/support') },
          { icon: 'information-circle-outline', label: 'About', onPress: () => router.push('/profile/about') },
        ]}
      />
    </Screen>
  );
}
