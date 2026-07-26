// Goal — single-select. Tapping a card records the goal, fires a selection
// haptic, and auto-advances after a beat so the selected state is visible first.
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { haptics } from '@/lib/haptics';
import { navigate } from '@/lib/nav';
import { space } from '@/lib/design/tokens';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { Goal } from '@/lib/types';

const GOALS: { label: string; value: Goal; icon: string }[] = [
  { label: 'Lose weight', value: 'lose', icon: 'flame' },
  { label: 'Build muscle', value: 'muscle', icon: 'barbell' },
  { label: 'Eat healthier', value: 'eat_healthier', icon: 'restaurant' },
  { label: 'Track my nutrition', value: 'track', icon: 'stats-chart' },
];

export default function GoalScreen() {
  const goal = useOnboardingStore((s) => s.goal);
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const pick = (value: Goal) => {
    setGoal(value);
    haptics.selection();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate('/onboarding/activity'), 300);
  };

  return (
    <OnbScaffold step={1} title="What's your main goal?">
      <View style={{ gap: space.md }}>
        {GOALS.map((g, i) => (
          <OptionCard
            key={g.value}
            icon={g.icon}
            label={g.label}
            selected={goal === g.value}
            onPress={() => pick(g.value)}
            delay={i * 60}
          />
        ))}
      </View>
    </OnbScaffold>
  );
}
