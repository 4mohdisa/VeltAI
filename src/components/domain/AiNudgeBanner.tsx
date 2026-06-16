// AiNudgeBanner (F4) — a dismissable in-app banner shown when an AI nudge fires
// while the app is open. Tap → the relevant screen; X dismisses.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export type AiNudgeBannerProps = {
  message: string;
  onPress?: () => void;
  onDismiss?: () => void;
};

export function AiNudgeBanner({ message, onPress, onDismiss }: AiNudgeBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      haptic={false}
      minTapTarget={false}
      accessibilityLabel={message}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        backgroundColor: color.accentLight,
        borderColor: color.accentBorder,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: space.md,
      }}
    >
      <Icon name="sparkles" size={18} color={color.accentText} />
      <Text variant="footnote" color={color.accentText} style={{ flex: 1 }}>
        {message}
      </Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} haptic={false} accessibilityLabel="Dismiss nudge">
          <Icon name="close" size={18} color={color.accentText} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
