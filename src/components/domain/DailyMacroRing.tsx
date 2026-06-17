// DailyMacroRing — the calories-vs-target ring on the Dashboard. The progress arc
// is the energy/calorie accent (orange) on a light grey track; the centre number
// stays black. Colour encodes the calorie data — track + number stay monochrome.
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/primitives/Text';
import { categoryAccent, color } from '@/lib/design/tokens';
import { formatNumber } from '@/lib/formatting';
import { kcalToDisplay, type EnergyUnit } from '@/lib/units';

export type DailyMacroRingProps = {
  consumed: number; // canonical kcal
  target: number; //   canonical kcal
  size?: number;
  strokeWidth?: number;
  energyUnit?: EnergyUnit;
};

export function DailyMacroRing({ consumed, target, size = 168, strokeWidth = 14, energyUnit = 'kcal' }: DailyMacroRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(1, consumed / target) : 0;
  const dash = circumference * pct;
  const center = size / 2;
  const consumedDisplay = kcalToDisplay(consumed, energyUnit);
  const targetDisplay = kcalToDisplay(target, energyUnit);

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel={`${formatNumber(consumedDisplay)} of ${formatNumber(targetDisplay)} ${energyUnit}`}
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
        {formatNumber(consumedDisplay)}
      </Text>
      <Text variant="footnote" color={color.gray500}>
        of {formatNumber(targetDisplay)} {energyUnit}
      </Text>
    </View>
  );
}
