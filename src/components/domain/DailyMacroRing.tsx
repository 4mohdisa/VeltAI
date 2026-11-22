// DailyMacroRing — the calories-vs-target ring on the Dashboard. The progress arc
// is the energy/calorie accent (orange) on a light grey track; the centre number
// stays black. Colour encodes the calorie data — track + number stay monochrome.
//
// The ring and the centre number ease to a changed value (same Animated.Value
// + listener pattern as ProgressBar.tsx and EnergyBalanceCard.tsx) rather than
// snapping, unless Reduce Motion is on or this is the ring's first paint.
import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/primitives/Text';
import { categoryAccent, color } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { formatNumber } from '@/lib/formatting';
import { kcalToDisplay, type EnergyUnit } from '@/lib/units';

export type DailyMacroRingProps = {
  consumed: number; // canonical kcal
  target: number; //   canonical kcal
  size?: number;
  strokeWidth?: number;
  energyUnit?: EnergyUnit;
};

const VALUE_ANIMATION_MS = 250;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function DailyMacroRing({ consumed, target, size = 168, strokeWidth = 14, energyUnit = 'kcal' }: DailyMacroRingProps) {
  const { t } = useTranslation();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(1, consumed / target) : 0;
  const center = size / 2;
  const targetDisplay = kcalToDisplay(target, energyUnit);

  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(pct)).current;
  const consumedAnim = useRef(new Animated.Value(consumed)).current;
  const [displayConsumed, setDisplayConsumed] = useState(consumed);
  // False only until this ring's own first effect run, so a freshly mounted
  // ring jumps straight to its starting value instead of easing from it.
  const hasShown = useRef(false);

  useEffect(() => {
    if (reduceMotion || !hasShown.current) {
      progress.setValue(pct);
      consumedAnim.setValue(consumed);
      setDisplayConsumed(consumed);
      hasShown.current = true;
      return;
    }
    const id = consumedAnim.addListener(({ value }) => setDisplayConsumed(value));
    const ringAnim = Animated.timing(progress, { toValue: pct, duration: VALUE_ANIMATION_MS, useNativeDriver: false });
    const numberAnim = Animated.timing(consumedAnim, { toValue: consumed, duration: VALUE_ANIMATION_MS, useNativeDriver: false });
    ringAnim.start();
    numberAnim.start();
    return () => {
      ringAnim.stop();
      numberAnim.stop();
      consumedAnim.removeListener(id);
    };
  }, [pct, consumed, reduceMotion, progress, consumedAnim]);

  // Dash = gap = the full circumference, so the whole pattern period never
  // exceeds one trip around the ring; shifting its offset is what reveals (or
  // hides, at pct 0) an arc of exactly `pct` starting at the top.
  const strokeDashoffset = progress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });
  const consumedDisplay = kcalToDisplay(displayConsumed, energyUnit);

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel={`${formatNumber(kcalToDisplay(consumed, energyUnit))} ${t('nutrition.ringOf')} ${formatNumber(targetDisplay)} ${energyUnit}`}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={center} cy={center} r={radius} stroke={color.light2} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={categoryAccent.calories}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
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
