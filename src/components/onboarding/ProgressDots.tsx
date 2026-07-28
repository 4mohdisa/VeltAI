// ProgressDots — the onboarding step indicator. A row of dots; each dot for a
// step <= `current` fills black and widens into a pill; the rest stay grey.
// The fill animates in on mount (staggered) and respects Reduce Motion.
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/design/reduceMotion';
import { color, motion, radius, space } from '@/lib/design/tokens';

export type ProgressDotsProps = { current: number; total: number };

function Dot({ filled, index }: { filled: boolean; index: number }) {
  const reduceMotion = useReduceMotion();
  const v = useSharedValue(reduceMotion ? (filled ? 1 : 0) : 0);

  useEffect(() => {
    const target = filled ? 1 : 0;
    v.value = reduceMotion
      ? target
      : withDelay(index * 40, withTiming(target, { duration: motion.duration.snap }));
  }, [filled, index, reduceMotion, v]);

  const animStyle = useAnimatedStyle(() => ({
    width: 8 + 8 * v.value,
    backgroundColor: interpolateColor(v.value, [0, 1], [color.gray400, color.black]),
  }));

  return <Animated.View style={[{ height: 8, borderRadius: radius.full }, animStyle]} />;
}

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current} of ${total}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}
    >
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} index={i} filled={i + 1 <= current} />
      ))}
    </View>
  );
}
