// LockoutBanner — Dashboard banner summarising lockout state. When the gym
// isn't logged yet it reads as a warn (apps are locked); once logged it reads
// as a calm accent "lifted" state. Tap → lockout status detail.
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

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
  const bg = locked ? color.warnLight : color.accentLight;
  const border = locked ? color.warnBorder : color.accentBorder;
  const fg = locked ? color.warnText : color.accentText;

  return (
    <Pressable
      onPress={onPress}
      haptic={false}
      minTapTarget={false}
      accessibilityLabel={
        locked
          ? `${appCount} apps locked until you log the gym`
          : 'Lockout lifted for today'
      }
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: space.lg,
      }}
    >
      <Ionicons name={locked ? 'lock-closed' : 'lock-open'} size={22} color={fg} />
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="bodyBold" color={fg}>
          {locked ? `${appCount} apps locked` : 'Lockout lifted — nice work'}
        </Text>
        <Text variant="footnote" color={locked ? color.warnText : color.gray700}>
          {locked ? `Until you log the gym · ${windowLabel}` : 'Logged today — your apps are open'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={fg} />
    </Pressable>
  );
}
