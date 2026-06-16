// A12 · Your gym
// Current sessions/week and target sessions/week as sliders, with the change
// shown plainly ("from 1 to 4").
import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { SliderField } from '@/components/forms/SliderField';
import { Text } from '@/components/primitives/Text';
import { color } from '@/lib/design/tokens';
import { useOnboarding } from '@/lib/onboarding/store';

export default function GymOnboardingScreen() {
  const { gymCurrent, gymTarget } = useOnboarding();
  const set = useOnboarding((s) => s.set);

  return (
    <OnboardingStep step={12} title="Where are you at with the gym?" subtitle="Honest beats optimistic.">
      <SliderField
        label="Sessions per week now"
        value={gymCurrent}
        min={0}
        max={7}
        step={1}
        onValueChange={(v) => set({ gymCurrent: v })}
        formatValue={(v) => `${v} / week`}
      />
      <SliderField
        label="Target sessions per week"
        value={gymTarget}
        min={1}
        max={7}
        step={1}
        onValueChange={(v) => set({ gymTarget: v })}
        formatValue={(v) => `${v} / week`}
      />
      <Text variant="title3" color={color.black}>
        From {gymCurrent} to {gymTarget} sessions a week.
      </Text>
    </OnboardingStep>
  );
}
