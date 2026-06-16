// B3 · Lockout status
// Which apps are currently blocked, grace time remaining today, emergency
// unlocks left this week. Big "Use grace period" button; emergency unlock is
// smaller and (per spec) requires a 4-digit confirmation code.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { router } from 'expo-router';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Stat } from '@/components/display/Stat';
import { Badge } from '@/components/display/Badge';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, radius, space } from '@/lib/design/tokens';
import { mockLockout } from '@/lib/mock/data';

export default function LockoutStatusScreen() {
  return (
    <Screen
      title="Lockout"
      showBack
      footer={
        <View style={{ gap: space.sm }}>
          <Button
            title="Use grace period (5 min)"
            icon="time"
            onPress={() => showToast({ message: '5 minutes of grace started.', tone: 'info' })}
          />
          <Button
            title="Use emergency unlock"
            variant="destructive"
            onPress={() =>
              showToast({
                message: 'Emergency unlock needs a 4-digit confirm code.',
                tone: 'warn',
              })
            }
          />
        </View>
      }
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Icon name="lock-closed" size={22} color={color.gray700} />
          <View style={{ flex: 1 }}>
            <Text variant="title3" color={color.black}>
              Apps locked
            </Text>
            <Text variant="footnote" color={color.gray500}>
              {mockLockout.windowLabel} · {mockLockout.mode} mode
            </Text>
          </View>
          <Badge label="Active" />
        </View>
      </Card>

      <View>
        <Text variant="footnote" color={color.gray500} style={{ marginBottom: space.sm, textTransform: 'uppercase', letterSpacing: 1 }}>
          Blocked apps
        </Text>
        <Card padded={false}>
          {mockLockout.apps.map((app, i) => (
            <View
              key={app}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                padding: space.lg,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: color.gray100,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.sm,
                  backgroundColor: color.gray100,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="apps" size={16} color={color.gray500} />
              </View>
              <Text variant="body" color={color.black} style={{ flex: 1 }}>
                {app}
              </Text>
              <Icon name="lock-closed" size={16} color={color.gray700} />
            </View>
          ))}
        </Card>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <Stat
            value={`${mockLockout.graceRemainingMin}m`}
            label="Grace left"
            size="small"
            align="center"
          />
          <Stat
            value={`${mockLockout.emergencyLeft}/${mockLockout.emergencyTotal}`}
            label="Emergency"
            size="small"
            align="center"
          />
        </View>
      </Card>

      <Button
        title="Preview the block screen"
        variant="tertiary"
        icon="eye"
        onPress={() => router.push('/modals/lockout-blocked')}
      />
    </Screen>
  );
}
