// E11 · About
// App version, build number, credits, third-party licenses link.
import { Linking, View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export default function AboutScreen() {
  return (
    <Screen title="About" showBack>
      <View style={{ alignItems: 'center', gap: space.xs, paddingVertical: space.xl }}>
        <Text variant="title1" color={color.black}>
          Veltai
        </Text>
        <Text variant="footnote" color={color.gray500}>
          Make going to the gym the easy choice.
        </Text>
      </View>

      <SettingsList
        rows={[
          { icon: 'pricetag-outline', label: 'Version', value: '1.0.0', kind: 'plain' },
          { icon: 'construct-outline', label: 'Build', value: '1', kind: 'plain' },
          { icon: 'people-outline', label: 'Credits', value: 'Veltai team', kind: 'plain' },
          { icon: 'document-text-outline', label: 'Third-party licenses', onPress: () => Linking.openURL('https://veltai.app/licenses').catch(() => {}) },
        ]}
      />
    </Screen>
  );
}
