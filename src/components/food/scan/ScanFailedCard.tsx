// ScanFailedCard — shown at the top of the log when a photo scan couldn't be
// analysed. Offers the two recoveries: log the food by hand, or discard the
// failed row. Muted (red rail) so it reads as an error state, not a normal card.
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { Button } from '@/components/forms/Button';
import { Icon } from '@/components/primitives/Icon';
import { accent, color, motion, radius, space, surface } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';

export type ScanFailedCardProps = {
  onLogManually: () => void;
  onDiscard: () => void;
};

export function ScanFailedCard({ onLogManually, onDiscard }: ScanFailedCardProps) {
  const reduce = useReduceMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInUp.duration(motion.duration.medium)}
      style={{
        flexDirection: 'row',
        backgroundColor: surface.card,
        borderRadius: radius.lg,
        overflow: 'hidden',
        marginBottom: space.lg,
      }}
    >
      <View style={{ width: space.xs, backgroundColor: accent.red }} />
      <View style={{ flex: 1, padding: space.lg, gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Icon name="alert-circle-outline" size={20} color={accent.red} />
          <Text variant="title3" color={color.label} accessibilityRole="header">
            Couldn&apos;t analyse this photo
          </Text>
        </View>
        <Text variant="footnote" color={color.secondaryLabel}>
          The scan didn&apos;t come back. You can still log this meal by hand.
        </Text>

        <Pressable
          haptic
          minTapTarget={false}
          onPress={onLogManually}
          accessibilityRole="button"
          accessibilityLabel="Log manually instead"
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}
        >
          <Text variant="bodyBold" color={color.label}>
            Log manually instead
          </Text>
          <Icon name="chevron-forward" size={16} color={color.label} />
        </Pressable>

        <Button title="Discard" variant="secondary" onPress={onDiscard} />
      </View>
    </Animated.View>
  );
}
