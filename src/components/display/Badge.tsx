// Badge — a small pill for rank names, streak counts, verification status.
// Tones map to the limited semantic palette; `fire` is reserved for streaks.
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export type BadgeTone = 'accent' | 'neutral' | 'warn' | 'error' | 'fire';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const tones: Record<BadgeTone, { bg: string; border: string; fg: string }> = {
  accent: { bg: color.accentLight, border: color.accentBorder, fg: color.accentText },
  neutral: { bg: color.gray100, border: color.gray200, fg: color.gray700 },
  warn: { bg: color.warnLight, border: color.warnBorder, fg: color.warnText },
  error: { bg: color.errorLight, border: color.errorBorder, fg: color.error },
  fire: { bg: color.warnLight, border: color.warnBorder, fg: color.streakFire },
};

export function Badge({ label, tone = 'neutral', icon, style, testID }: BadgeProps) {
  const t = tones[tone];
  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.xs,
          alignSelf: 'flex-start',
          backgroundColor: t.bg,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: radius.full,
          paddingVertical: space.xs,
          paddingHorizontal: space.sm,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={13} color={t.fg} /> : null}
      <Text variant="caption" color={t.fg} style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}
