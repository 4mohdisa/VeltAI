// StreakFlame — the flame icon next to a streak count. Gently pulses while the
// streak is active; static when inactive or Reduce Motion is on. Uses the
// reserved streakFire colour (flame only — never elsewhere).
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';

import { color, motion } from '@/lib/design/tokens';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

export type StreakFlameProps = {
  size?: number;
  active?: boolean;
  tint?: string;
};

export function StreakFlame({ size = 24, active = true, tint = color.streakFire }: StreakFlameProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active || reduceMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withTiming(1.14, { duration: motion.duration.slow, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [active, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <AnimatedIonicons name="flame" size={size} color={active ? tint : color.gray400} />
    </Animated.View>
  );
}
