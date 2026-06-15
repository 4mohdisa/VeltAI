// A8 · Goal
// "Where do you want to be in 90 days?" Goal type as a segmented control. If a
// weight goal is chosen, a weight slider + projected date appear below.
import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { SliderField } from '@/components/forms/SliderField';
import { Text } from '@/components/primitives/Text';
import { color } from '@/lib/design/tokens';
import { formatLongDate } from '@/lib/formatting';
import { useOnboarding, type GoalType } from '@/lib/onboarding/store';

const GOALS: { label: string; value: GoalType }[] = [
  { label: 'Lose weight', value: 'lose' },
  { label: 'Build muscle', value: 'muscle' },
  { label: 'Gym consistency', value: 'consistency' },
  { label: 'Eat better', value: 'eat-better' },
];

export default function GoalScreen() {
  const { goal, targetWeight } = useOnboarding();
  const set = useOnboarding((s) => s.set);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 90);

  return (
    <OnboardingStep step={8} title="Where do you want to be in 90 days?" subtitle="Big or small, we plan around it.">
      <SegmentedField
        value={goal}
        onChange={(v) => set({ goal: v })}
        options={GOALS.slice(0, 2)}
      />
      <SegmentedField value={goal} onChange={(v) => set({ goal: v })} options={GOALS.slice(2)} />

      {goal === 'lose' ? (
        <>
          <SliderField
            label="Target weight"
            value={targetWeight}
            min={50}
            max={120}
            step={1}
            onValueChange={(v) => set({ targetWeight: v })}
            formatValue={(v) => `${v} kg`}
          />
          <Text variant="footnote" color={color.gray500}>
            On track to hit it by {formatLongDate(targetDate)}.
          </Text>
        </>
      ) : null}
    </OnboardingStep>
  );
}
