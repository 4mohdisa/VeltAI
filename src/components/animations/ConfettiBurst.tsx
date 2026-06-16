// ConfettiBurst — a one-shot celebratory particle burst for streak milestones
// and rank-ups. Colours are drawn from the tokens only (accent family + grays +
// black) — no rogue rainbow palette. Renders nothing under Reduce Motion.
import { useEffect, useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useReducedMotion,
  type SharedValue,
  Easing,
} from 'react-native-reanimated';

import { color, radius, motion, zIndex } from '@/lib/design/tokens';

const PALETTE = [color.black, color.black, color.gray300, color.gray400, color.black];

type ParticleSpec = {
  dx: number;
  dy: number;
  rotate: number;
  size: number;
  delayFactor: number;
  fill: string;
};

function Particle({ spec, progress }: { spec: ParticleSpec; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(1, (progress.value - spec.delayFactor) / (1 - spec.delayFactor)));
    return {
      opacity: interpolate(p, [0, 0.7, 1], [1, 1, 0]),
      transform: [
        { translateX: spec.dx * p },
        { translateY: spec.dy * p },
        { rotate: `${spec.rotate * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: spec.size,
          height: spec.size * 0.5,
          borderRadius: radius.sm,
          backgroundColor: spec.fill,
        },
        style,
      ]}
    />
  );
}

export type ConfettiBurstProps = {
  count?: number;
  trigger?: number;
};

export function ConfettiBurst({ count = 16, trigger = 0 }: ConfettiBurstProps) {
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const progress = useSharedValue(0);

  const particles = useMemo<ParticleSpec[]>(() => {
    return Array.from({ length: count }).map((_, i) => {
      const spread = (i / count) * 2 - 1; // -1..1
      return {
        dx: spread * (width * 0.45),
        dy: 220 + ((i * 37) % 160),
        rotate: (i % 2 === 0 ? 1 : -1) * (180 + (i * 23) % 180),
        size: 8 + (i % 3) * 4,
        delayFactor: (i % 5) * 0.06,
        fill: PALETTE[i % PALETTE.length],
      };
    });
  }, [count, width]);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: motion.duration.epic, easing: Easing.out(Easing.quad) });
  }, [trigger, reduceMotion, progress]);

  if (reduceMotion) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: '28%',
        left: '50%',
        width: 0,
        height: 0,
        zIndex: zIndex.fullModal,
      }}
    >
      {particles.map((spec, i) => (
        <Particle key={i} spec={spec} progress={progress} />
      ))}
    </View>
  );
}
