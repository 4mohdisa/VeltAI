// LockoutBanner — Dashboard banner summarising lockout state. Monochrome grey
// fill, black lock icon, black text (never amber). State is carried by the icon
// (lock vs lock.open) and copy, not colour.
import { View } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, surface } from '@/lib/design/tokens';

export type LockoutBannerProps = {
  enabled: boolean;
  gymLogged: boolean;
  appCount: number;
  windowLabel: string;
  onPress: () => void;
};

export function LockoutBanner({ enabled, gymLogged, appCount, windowLabel, onPress }: LockoutBannerProps) {
  if (!enabled) return null;

  const locked = !gymLogged;

  return (
    <Pressable
      onPress={onPress}
      haptic={false}
      minTapTarget={false}
      accessibilityLabel={
        locked ? `${appCount} apps locked until you log the gym` : 'Lockout lifted for today'
      }
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: surface.card,
        borderRadius: radius.lg,
        padding: space.xl,
      }}
    >
      <Icon name={locked ? 'lock-closed' : 'lock-open'} size={22} color={color.black} />
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="bodyBold" color={color.black}>
          {locked ? `${appCount} apps locked` : 'Lockout lifted — nice work'}
        </Text>
        <Text variant="footnote" color={color.gray600}>
          {locked ? `Until you log the gym · ${windowLabel}` : 'Logged today — your apps are open'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color={color.gray400} />
    </Pressable>
  );
}
