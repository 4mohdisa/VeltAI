// E7 · Apple Health
// Exactly two flows: READ active energy + steps (calorie cross-check) and WRITE
// logged nutrition (only when the user chooses, per meal). Deep link to iOS
// Settings for granular control.
import { Linking, Switch, View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { SettingsList } from '@/components/display/SettingsList';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { useSettingsStore } from '@/lib/settings/store';

const READ_TYPES = [
  { icon: 'flame-outline' as const, label: 'Active energy' },
  { icon: 'walk-outline' as const, label: 'Steps' },
];

export default function AppleHealthScreen() {
  const connected = useSettingsStore((s) => s.healthConnected);
  const setHealthConnected = useSettingsStore((s) => s.setHealthConnected);

  const toggle = (next: boolean) => {
    setHealthConnected(next);
    showToast({ message: next ? 'Apple Health connected.' : 'Apple Health disconnected.', tone: next ? 'success' : 'info' });
  };

  return (
    <Screen grouped
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
          <View style={{ gap: space.xs, flex: 1 }}>
            <Text variant="title3" color={color.black}>
              Apple Health
            </Text>
            <Text variant="footnote" color={color.gray500}>
              Read active energy &amp; steps · write logged nutrition
            </Text>
          </View>
          <Switch
            value={connected}
            onValueChange={toggle}
            trackColor={{ true: color.black, false: color.gray300 }}
            accessibilityRole="switch"
            accessibilityLabel="Apple Health connection"
            accessibilityState={{ checked: connected }}
          />
        </View>
        <View style={{ marginTop: space.md, alignItems: 'flex-start' }}>
          <Badge
            label={connected ? 'Connected' : 'Not connected'}
            icon={connected ? 'checkmark-circle' : 'close-circle'}
          />
        </View>
      </Card>

      <SettingsList
        title="What we read"
        rows={READ_TYPES.map((d) => ({ icon: d.icon, label: d.label, kind: 'plain' as const }))}
      />

      <SettingsList
        title="What we write (when you choose)"
        rows={[{ icon: 'restaurant-outline', label: 'Logged nutrition · calories + macros', kind: 'plain' }]}
      />

      <Text variant="footnote" color={color.gray500}>
        We read your active energy and steps to cross-check your daily calorie goal. Nutrition is
        written to Apple Health only when you tap “Send to Apple Health” on a meal — never
        automatically. Revoke access any time in iOS Settings → Privacy → Health.
      </Text>
    </Screen>
  );
}
