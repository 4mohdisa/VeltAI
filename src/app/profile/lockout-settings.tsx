// E5 · Lockout settings
// Enable toggle, app picker (Apple Family Activity Picker in production —
// placeholder here), enforcement window, grace period, emergency unlocks left.
import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { SettingsList } from '@/components/display/SettingsList';
import { Stat } from '@/components/display/Stat';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { mockLockout } from '@/lib/mock/data';

export default function LockoutSettingsScreen() {
  const [enabled, setEnabled] = useState(mockLockout.enabled);
  const [window, setWindow] = useState<'always' | 'evening' | 'custom'>('evening');
  const [grace, setGrace] = useState<'30' | '15' | '0'>('30');

  return (
    <Screen title="Lockout" showBack>
      <SettingsList
        rows={[
          {
            icon: 'lock-closed-outline',
            label: 'Enable lockout',
            kind: 'toggle',
            switchValue: enabled,
            onToggle: setEnabled,
          },
        ]}
      />

      {enabled ? (
        <>
          <SettingsList
            title="Blocked apps"
            rows={[
              {
                icon: 'apps-outline',
                label: `${mockLockout.apps.length} apps selected`,
                value: 'Edit',
                onPress: () => showToast({ message: "Opens Apple's app picker on device.", tone: 'info' }),
              },
            ]}
          />

          <SegmentedField
            label="Enforcement window"
            value={window}
            onChange={setWindow}
            options={[
              { label: 'Always', value: 'always' },
              { label: 'Evening', value: 'evening' },
              { label: 'Custom', value: 'custom' },
            ]}
          />

          <SegmentedField
            label="Grace period"
            value={grace}
            onChange={setGrace}
            options={[
              { label: '30 min', value: '30' },
              { label: '15 min', value: '15' },
              { label: 'None', value: '0' },
            ]}
          />

          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <Stat
                value={`${mockLockout.emergencyLeft}/${mockLockout.emergencyTotal}`}
                label="Emergency left"
                size="small"
                align="center"
              />
              <Stat value={mockLockout.mode} label="Mode" size="small" align="center" />
            </View>
          </Card>
        </>
      ) : (
        <Text variant="callout" color={color.gray500}>
          Lockout is off. Turn it on to block distracting apps until you log the gym.
        </Text>
      )}
    </Screen>
  );
}
