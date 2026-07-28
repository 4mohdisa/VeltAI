// Activity — single-select, auto-advances (mirrors the goal screen).
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { haptics } from '@/lib/haptics';
import { navigate } from '@/lib/nav';
import { space } from '@/lib/design/tokens';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { ActivityLevel } from '@/lib/types';

const LEVELS: { label: string; value: ActivityLevel }[] = [
  { label: 'Mostly sitting (office work)', value: 'sedentary' },
  { label: 'Light activity (walks, light exercise)', value: 'light' },
  { label: 'Moderately active (3-4x/week)', value: 'moderate' },
  { label: 'Very active (daily training)', value: 'very_active' },
];

export default function ActivityScreen() {
  const activity = useOnboardingStore((s) => s.activity_level);
  const setActivity = useOnboardingStore((s) => s.setActivity);
  const reduceMotion = useReduceMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const pick = (value: ActivityLevel) => {
    setActivity(value);
    haptics.selection();
    if (timer.current) clearTimeout(timer.current);
    if (reduceMotion) {
      navigate('/onboarding/cuisine');
      return;
    }
    timer.current = setTimeout(() => navigate('/onboarding/cuisine'), 300);
  };

  return (
    <OnbScaffold step={2} title="How active are you?">
      <View style={{ gap: space.md }}>
        {LEVELS.map((l, i) => (
          <OptionCard
            key={l.value}
            label={l.label}
            selected={activity === l.value}
            onPress={() => pick(l.value)}
            delay={i * 60}
          />
        ))}
      </View>
    </OnbScaffold>
  );
}
