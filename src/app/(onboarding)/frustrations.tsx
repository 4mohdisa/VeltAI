// A6 · What frustrates you about fitness apps?
// Six options + a free-text field. All optional, with a prominent Skip. The
// free text becomes an AI prompt hint ("avoid that pattern").
import { router } from 'expo-router';

import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { MultiSelectField } from '@/components/forms/MultiSelectField';
import { TextField } from '@/components/forms/TextField';
import { useOnboarding } from '@/lib/onboarding/store';
import { onboardingHref } from '@/lib/onboarding/steps';

const OPTIONS = [
  { label: 'Got it wrong about my food', value: 'wrong-food' },
  { label: 'Too many notifications', value: 'notifications' },
  { label: 'Felt judged or shamed', value: 'judged' },
  { label: 'Hidden pricing or sneaky charges', value: 'pricing' },
  { label: 'Boring after a few days', value: 'boring' },
  { label: 'Tried to sell me supplements', value: 'supplements' },
];

export default function FrustrationsScreen() {
  const { frustrations, frustrationText } = useOnboarding();
  const set = useOnboarding((s) => s.set);

  return (
    <OnboardingStep
      step={6}
      title="What was wrong with apps you've tried?"
      subtitle="Optional — skip if you haven't used one."
      onSkip={() => router.push(onboardingHref('reflection') as never)}
    >
      <MultiSelectField options={OPTIONS} selected={frustrations} onChange={(v) => set({ frustrations: v })} />
      <TextField
        label="Anything else?"
        placeholder="In your own words…"
        value={frustrationText}
        onChangeText={(t) => set({ frustrationText: t })}
        multiline
      />
    </OnboardingStep>
  );
}
