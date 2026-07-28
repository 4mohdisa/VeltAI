// E11 · About
// App version, build number, credits. (The third-party licenses row pointed at
// a dead domain — removed until a real licenses page exists.)
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export default function AboutScreen() {
  return (
    <Screen grouped title="About" showBack>
      <View style={{ alignItems: 'center', gap: space.xs, paddingVertical: space.xl }}>
        <Text variant="title1" color={color.black}>
          Lumo
        </Text>
        <Text variant="footnote" color={color.gray500}>
          Make going to the gym the easy choice.
        </Text>
      </View>

      <SettingsList
        rows={[
          { icon: 'pricetag-outline', label: 'Version', value: '1.0.0', kind: 'plain' },
          { icon: 'construct-outline', label: 'Build', value: '1', kind: 'plain' },
          { icon: 'people-outline', label: 'Credits', value: 'Lumo team', kind: 'plain' },
        ]}
      />
    </Screen>
  );
}
