// LoadingSkeleton (F6) — greyed placeholder shapes that match the eventual
// layout. Pulses opacity on the UI thread; honours Reduce Motion by staying
// static. Use these instead of bare spinners.
import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';

import { color, radius, space, motion, opacity } from '@/lib/design/tokens';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height = 16, rounded = radius.sm, style }: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(reduceMotion ? opacity.low : 1);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = opacity.low;
      return;
    }
    pulse.value = withRepeat(
      withTiming(opacity.low, { duration: motion.duration.slow, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduceMotion, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: rounded, backgroundColor: color.gray200 },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** A common card-shaped skeleton: title line + two body lines. */
export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          backgroundColor: color.white,
          borderColor: color.gray200,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: space.lg,
          gap: space.sm,
        },
        style,
      ]}
    >
      <Skeleton width="55%" height={20} />
      <Skeleton width="100%" height={14} />
      <Skeleton width="80%" height={14} />
    </View>
  );
}
