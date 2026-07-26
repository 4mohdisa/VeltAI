// E9 · Privacy
// Privacy policy, terms of use, EULA links; product analytics opt-out; data
// export marked Phase 2.
import { Linking } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { Text } from '@/components/primitives/Text';
import { color } from '@/lib/design/tokens';
import { useSettingsStore } from '@/lib/settings/store';

const open = (url: string) => () => Linking.openURL(url).catch(() => {});

export default function PrivacyScreen() {
  const analyticsEnabled = useSettingsStore((s) => s.analyticsEnabled);
  const setAnalyticsEnabled = useSettingsStore((s) => s.setAnalyticsEnabled);

  return (
    <Screen grouped title="Privacy" showBack>
      <SettingsList
        rows={[
          { icon: 'document-text-outline', label: 'Privacy policy', onPress: open('https://veltai.app/privacy') },
          { icon: 'reader-outline', label: 'Terms of use', onPress: open('https://veltai.app/terms') },
          { icon: 'document-outline', label: 'EULA', onPress: open('https://veltai.app/eula') },
        ]}
      />
      <SettingsList
        title="Analytics"
        rows={[
          {
            icon: 'pulse-outline',
            label: 'Product analytics',
            kind: 'toggle',
            switchValue: analyticsEnabled,
            onToggle: setAnalyticsEnabled,
          },
        ]}
      />
      <Text variant="footnote" color={color.gray500}>
        First-party only, on our own servers — which features are used, never what you log. Never
        sold. Off means fully off.
      </Text>
      <SettingsList
        title="Your data"
        rows={[{ icon: 'download-outline', label: 'Export my data', value: 'Phase 2', kind: 'plain' }]}
      />
      <Text variant="footnote" color={color.gray500}>
        Your health data stays private. We never sell it, and we run no advertising or tracking SDKs
        inside the app.
      </Text>
    </Screen>
  );
}
