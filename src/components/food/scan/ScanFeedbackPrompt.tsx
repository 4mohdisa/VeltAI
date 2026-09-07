// ScanFeedbackPrompt — the one-tap accuracy check shown once after saving a
// scan. Four ratings feed the backend's calibration. Auto-dismisses after 5s so
// it never blocks the log; tapping a rating dismisses immediately.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { color, motion, radius, shadow, space, surface } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import type { ScanFeedbackRating } from '@/lib/types';

export type ScanFeedbackPromptProps = {
  onRate: (rating: ScanFeedbackRating) => void;
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 5000;

const OPTIONS: { label: string; rating: ScanFeedbackRating }[] = [
  { label: 'Way off', rating: 'way_off' },
  { label: 'A bit off', rating: 'a_bit_off' },
  { label: 'Pretty good', rating: 'pretty_good' },
  { label: 'Spot on', rating: 'spot_on' },
];

export function ScanFeedbackPrompt({ onRate, onDismiss }: ScanFeedbackPromptProps) {
  const reduce = useReduceMotion();

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(motion.duration.fast)}
      exiting={reduce ? undefined : FadeOut.duration(motion.duration.snap)}
      style={{
        backgroundColor: surface.cardElevated,
        borderRadius: radius.xl,
        padding: space.xl,
        gap: space.md,
        ...shadow.sm,
      }}
    >
      <Text variant="footnote" color={color.secondaryLabel} accessibilityRole="header">
        How close was that estimate?
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.rating}
            haptic
            minTapTarget={false}
            onPress={() => onRate(o.rating)}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            style={{
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
              borderRadius: radius.pill,
              backgroundColor: surface.tile,
            }}
          >
            <Text variant="footnote" color={color.label}>
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}
