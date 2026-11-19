// ProgressBar — a simple track + fill used for macro bars and progress indicators.
// Clamps to [0,1]. Tint defaults to black. The fill eases to a changed value
// (same Animated.Value + listener pattern as EnergyBalanceCard's ring and net
// number) rather than snapping, unless Reduce Motion is on or this is the
// bar's first paint.
import { useEffect, useRef, useState } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, radius, space } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';

export type ProgressBarProps = {
  value: number;
  tint?: string;
  track?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const VALUE_ANIMATION_MS = 250;

export function ProgressBar({
  value,
  tint = color.black,
  track = color.gray200,
  height = space.sm,
  style,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  const reduceMotion = useReduceMotion();
  const pctAnim = useRef(new Animated.Value(pct)).current;
  const [displayPct, setDisplayPct] = useState(pct);
  // False only until this bar's own first effect run, so a freshly mounted
  // bar jumps straight to its starting value instead of easing from it.
  const hasShown = useRef(false);

  useEffect(() => {
    if (reduceMotion || !hasShown.current) {
      pctAnim.setValue(pct);
      setDisplayPct(pct);
      hasShown.current = true;
      return;
    }
    const id = pctAnim.addListener(({ value: v }) => setDisplayPct(v));
    const anim = Animated.timing(pctAnim, { toValue: pct, duration: VALUE_ANIMATION_MS, useNativeDriver: false });
    anim.start();
    return () => {
      anim.stop();
      pctAnim.removeListener(id);
    };
  }, [pct, reduceMotion, pctAnim]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[{ height, borderRadius: radius.full, backgroundColor: track, overflow: 'hidden' }, style]}
    >
      <View style={{ width: `${displayPct * 100}%`, height: '100%', backgroundColor: tint, borderRadius: radius.full }} />
    </View>
  );
}
