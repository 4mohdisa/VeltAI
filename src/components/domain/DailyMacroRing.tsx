// DailyMacroRing — the calories-vs-target ring on the Dashboard. The progress arc
// is the energy/calorie accent (orange) on a light grey track; the centre number
// stays black. Colour encodes the calorie data — track + number stay monochrome.
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/primitives/Text';
import { categoryAccent, color } from '@/lib/design/tokens';
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
        <Circle cx={center} cy={center} r={radius} stroke={color.light2} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={categoryAccent.calories}
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
