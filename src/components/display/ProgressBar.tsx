// ProgressBar — a simple track + fill used for macro bars and rank progress.
// Clamps to [0,1]. Tint defaults to accent; over-target callers pass warn.
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { color, radius } from '@/lib/design/tokens';

export type ProgressBarProps = {
  value: number;
  tint?: string;
  track?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({
  value,
  tint = color.accent,
  track = color.gray200,
  height = 8,
  style,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[{ height, borderRadius: radius.full, backgroundColor: track, overflow: 'hidden' }, style]}
    >
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: tint, borderRadius: radius.full }} />
    </View>
  );
}
