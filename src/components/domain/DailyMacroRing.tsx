// DailyMacroRing — the calories-vs-target ring on the Dashboard. SVG arc fills
// with the accent; turns warn if the user goes over target. Centre shows the
// running total. Built with react-native-svg.
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/primitives/Text';
import { color } from '@/lib/design/tokens';
import { formatNumber } from '@/lib/formatting';

export type DailyMacroRingProps = {
  consumed: number;
  target: number;
  size?: number;
  strokeWidth?: number;
};

export function DailyMacroRing({ consumed, target, size = 168, strokeWidth = 14 }: DailyMacroRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(1, consumed / target) : 0;
  const over = consumed > target;
  const dash = circumference * pct;
  const center = size / 2;

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel={`${formatNumber(consumed)} of ${formatNumber(target)} kilocalories`}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={center} cy={center} r={radius} stroke={color.gray200} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={over ? color.warn : color.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <Text variant="statMedium" color={color.black}>
        {formatNumber(consumed)}
      </Text>
      <Text variant="footnote" color={color.gray500}>
        of {formatNumber(target)} kcal
      </Text>
    </View>
  );
}
