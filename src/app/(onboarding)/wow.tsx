// A15 · Wow moment
// Top: animated 90-day weight projection chart (current → target). Bottom:
// tomorrow's personalised plan timeline with cuisine-matched suggestions.
// "This is your life, planned by the app."
import { View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { Card } from '@/components/display/Card';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, space } from '@/lib/design/tokens';
import { formatLongDate } from '@/lib/formatting';
import { mockPlan } from '@/lib/mock/data';
import { useOnboarding } from '@/lib/onboarding/store';

export default function WowScreen() {
  const { width } = useWindowDimensions();
  const { weight, targetWeight } = useOnboarding();
  const chartW = width - space.lg * 2 - space.lg * 2; // screen minus scroll + card padding
  const chartH = 120;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 90);

  // Map weight range to chart y (higher weight = higher y baseline)
  const hi = Math.max(weight, targetWeight);
  const lo = Math.min(weight, targetWeight);
  const pad = 16;
  const yFor = (w: number) => {
    if (hi === lo) return chartH / 2;
    return pad + ((hi - w) / (hi - lo)) * (chartH - pad * 2);
  };
  const startY = yFor(weight);
  const endY = yFor(targetWeight);
  const points = `0,${startY} ${chartW * 0.5},${(startY + endY) / 2} ${chartW},${endY}`;

  const meals = mockPlan.filter((p) => p.kind === 'meal' || p.kind === 'gym');

  return (
    <OnboardingStep step={15} title="Here's your plan" continueLabel="This looks right">
      {/* Projection chart */}
      <Animated.View entering={FadeIn.duration(500)}>
        <Card>
          <View style={{ gap: space.sm }}>
            <Text variant="footnote" color={color.gray500} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              90-day projection
            </Text>
            <Svg width={chartW} height={chartH}>
              {/* baseline gridline stays monochrome; the projection line encodes
                  a positive trajectory → green (functional data colour). */}
              <Line x1={0} y1={chartH - 1} x2={chartW} y2={chartH - 1} stroke={color.light2} strokeWidth={1} />
              <Polyline points={points} fill="none" stroke={categoryAccent.positive} strokeWidth={3} strokeLinecap="round" />
              <Circle cx={0} cy={startY} r={5} fill={categoryAccent.positive} />
              <Circle cx={chartW} cy={endY} r={5} fill={categoryAccent.positive} />
            </Svg>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="footnote" color={color.gray500}>
                Now {weight} kg
              </Text>
              <Text variant="footnote" color={color.black}>
                {targetWeight} kg by {formatLongDate(targetDate)}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Tomorrow's plan */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <Card>
          <View style={{ gap: space.md }}>
            <Text variant="title3" color={color.black}>
              Tomorrow, planned for you
            </Text>
            {meals.map((m) => (
              <View key={m.time} style={{ flexDirection: 'row', gap: space.md }}>
                <Text variant="footnote" color={color.gray500} style={{ width: 48 }}>
                  {m.time}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyBold" color={color.black}>
                    {m.title}
                    {m.targetKcal ? ` · ${m.targetKcal} kcal` : ''}
                  </Text>
                  {m.suggestions ? (
                    <Text variant="footnote" color={color.gray500}>
                      {m.suggestions.slice(0, 2).join(', ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>
    </OnboardingStep>
  );
}
