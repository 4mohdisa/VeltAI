// XpFloatUp (F1) — "+25 XP" floats up from a source and fades over ~800ms.
// Mount it when XP is earned and remove it via onDone. Honours Reduce Motion by
// resolving instantly. Runs entirely on the UI thread.
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming, useReducedMotion } from 'react-native-reanimated';

import { color, type as typeScale, motion } from '@/lib/design/tokens';

export type XpFloatUpProps = {
  amount: number;
  onDone?: () => void;
  tint?: string;
};

export function XpFloatUp({ amount, onDone, tint = color.accent }: XpFloatUpProps) {
  const reduceMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      onDone?.();
      return;
    }
    opacity.value = withSequence(
      withTiming(1, { duration: motion.duration.snap }),
      withDelay(motion.duration.medium, withTiming(0, { duration: motion.duration.fast })),
    );
    translateY.value = withTiming(-64, { duration: motion.duration.slow });
    const timer = setTimeout(() => onDone?.(), motion.duration.slow);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (reduceMotion) return null;

  return (
    <Animated.Text
      pointerEvents="none"
      accessibilityElementsHidden
      style={[
        {
          position: 'absolute',
          fontSize: typeScale.statSmall.fontSize,
          fontWeight: '700',
          color: tint,
        },
        animatedStyle,
      ]}
    >
      +{amount} XP
    </Animated.Text>
  );
}
