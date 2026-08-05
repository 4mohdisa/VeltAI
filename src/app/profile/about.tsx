// E11 · About
// App version, build number, credits. (The third-party licenses row pointed at
// a dead domain — removed until a real licenses page exists.)
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { APP_VERSION, BUILD_NUMBER } from '@/lib/appVersion';

export default function AboutScreen() {
  return (
    <Screen grouped title="About" showBack>
      <View style={{ alignItems: 'center', gap: space.xs, paddingVertical: space.xl }}>
        <Text variant="title1" color={color.black}>
          Lume
        </Text>
        <Text variant="footnote" color={color.gray500}>
          Make going to the gym the easy choice.
        </Text>
      </View>

      <SettingsList
        rows={[
          { icon: 'pricetag-outline', label: 'Version', value: APP_VERSION, kind: 'plain' },
          { icon: 'construct-outline', label: 'Build', value: BUILD_NUMBER, kind: 'plain' },
          { icon: 'people-outline', label: 'Credits', value: 'Lume team', kind: 'plain' },
        ]}
      />
    </Screen>
  );
}
