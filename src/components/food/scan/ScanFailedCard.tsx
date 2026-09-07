// ScanFailedCard — shown at the top of the log when a photo scan couldn't be
// analysed. Offers the two recoveries: log the food by hand, or discard the
// failed row. Same elevated chrome as every other card on the page; the error is
// carried by the red glyph in the header, not by a tinted rail (tokens.ts:
// colour never touches chrome).
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { Button } from '@/components/forms/Button';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { Icon } from '@/components/primitives/Icon';
import { accent, color, motion, radius, shadow, space, surface } from '@/lib/design/tokens';
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
        backgroundColor: surface.cardElevated,
        borderRadius: radius.xl,
        overflow: 'hidden',
        ...shadow.sm,
      }}
    >
      <View style={{ flex: 1, padding: space.xl, gap: space.md }}>
        <CardHeaderRow title="Couldn't analyse this photo" icon="alert-circle-outline" tint={accent.red} />
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
