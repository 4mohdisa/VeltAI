// TypingIndicator — three dots that pulse in sequence while Lumo "thinks".
// Each dot scales 0.6→1→0.6 on a loop, offset 200ms apart. Reduce-motion aware
// (three static dots, no animation).
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Animated, View } from 'react-native';

import { useReduceMotion } from '@/lib/design/reduceMotion';
import { color, motion, radius, space } from '@/lib/design/tokens';

export function TypingIndicator(props?: { color?: string }): JSX.Element {
  const dotColor = props?.color ?? color.gray400;
  const reduceMotion = useReduceMotion();
  const [dots] = useState(() => [new Animated.Value(0.6), new Animated.Value(0.6), new Animated.Value(0.6)]);

  useEffect(() => {
    if (reduceMotion) return;
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(d, { toValue: 1, duration: motion.duration.snap, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.6, duration: motion.duration.snap, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduceMotion, dots]);

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}
      accessibilityLabel="Lumo is typing"
    >
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: space.sm,
            height: space.sm,
            borderRadius: radius.full,
            backgroundColor: dotColor,
            transform: [{ scale: d }],
          }}
        />
      ))}
    </View>
  );
}
