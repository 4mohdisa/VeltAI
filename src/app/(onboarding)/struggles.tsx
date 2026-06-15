// A4 · What's been getting in the way?
// Eight multi-select option cards. Continue activates once at least one is
// picked. Framed as understanding, not interrogation.
import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { MultiSelectField } from '@/components/forms/MultiSelectField';
import { useOnboarding } from '@/lib/onboarding/store';

const OPTIONS = [
  { label: "Motivation — I don't feel like it", value: 'motivation' },
  { label: 'Time — too busy', value: 'time' },
  { label: "Energy — too tired after work", value: 'energy' },
  { label: "Knowledge — I don't know what I'm doing", value: 'knowledge' },
  { label: 'Intimidation — gym feels awkward', value: 'intimidation' },
  { label: 'Food noise — I keep grazing', value: 'food-noise' },
  { label: 'Injury or pain', value: 'injury' },
  { label: 'Something else', value: 'other' },
];

export default function StrugglesScreen() {
  const struggles = useOnboarding((s) => s.struggles);
  const set = useOnboarding((s) => s.set);

  return (
    <OnboardingStep
      step={4}
      title="What's been getting in the way?"
      subtitle="Pick as many as you like."
      continueDisabled={struggles.length === 0}
    >
      <MultiSelectField options={OPTIONS} selected={struggles} onChange={(v) => set({ struggles: v })} />
    </OnboardingStep>
  );
}
