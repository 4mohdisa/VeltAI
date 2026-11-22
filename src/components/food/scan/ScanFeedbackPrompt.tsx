// ScanFeedbackPrompt — the one-tap accuracy check shown once after saving a
// scan. Four ratings feed the backend's calibration. Auto-dismisses after 5s so
// it never blocks the log; tapping a rating dismisses immediately.
import { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
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

const OPTIONS: { labelKey: string; rating: ScanFeedbackRating }[] = [
  { labelKey: 'scanCards.wayOff', rating: 'way_off' },
  { labelKey: 'scanCards.aBitOff', rating: 'a_bit_off' },
  { labelKey: 'scanCards.prettyGood', rating: 'pretty_good' },
  { labelKey: 'scanCards.spotOn', rating: 'spot_on' },
];

export function ScanFeedbackPrompt({ onRate, onDismiss }: ScanFeedbackPromptProps) {
  const { t } = useTranslation();
  const reduce = useReduceMotion();

  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
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
        {t('scanCards.feedbackQuestion')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.rating}
            haptic
            minTapTarget={false}
            onPress={() => onRate(o.rating)}
            accessibilityRole="button"
            accessibilityLabel={t(o.labelKey)}
            style={{
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
              borderRadius: radius.pill,
              backgroundColor: surface.tile,
            }}
          >
            <Text variant="footnote" color={color.label}>
              {t(o.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}
