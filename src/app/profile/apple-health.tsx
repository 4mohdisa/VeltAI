// E7 · Apple Health
// Connection status, the data types we read, and a deep link to iOS Settings
// for granular control.
import { Linking, View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { SettingsList } from '@/components/display/SettingsList';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

const DATA_TYPES = [
  { icon: 'walk-outline' as const, label: 'Steps' },
  { icon: 'bed-outline' as const, label: 'Sleep' },
  { icon: 'heart-outline' as const, label: 'Heart rate' },
  { icon: 'flame-outline' as const, label: 'Active energy' },
];

export default function AppleHealthScreen() {
  return (
    <Screen
      title="Apple Health"
      showBack
      footer={
        <Button
          title="Open iOS Settings"
          variant="secondary"
          onPress={() => Linking.openURL('app-settings:').catch(() => {})}
        />
      }
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: space.xs }}>
            <Text variant="title3" color={color.black}>
              Apple Health
            </Text>
            <Text variant="footnote" color={color.gray500}>
              Used to auto-detect gym sessions
            </Text>
          </View>
          <Badge label="Connected" icon="checkmark-circle" />
        </View>
      </Card>

      <SettingsList title="What we read" rows={DATA_TYPES.map((d) => ({ icon: d.icon, label: d.label, kind: 'plain' as const }))} />

      <Text variant="footnote" color={color.gray500}>
        Veltai never writes to Apple Health in this version. You can revoke access any time in iOS
        Settings → Privacy → Health.
      </Text>
    </Screen>
  );
}
