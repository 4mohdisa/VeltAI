// A9 · Why
// "Why does this matter to you?" Free text, emphasised but skippable. Used later
// by the AI in nudges ("remember why you started").
import { router } from 'expo-router';

import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { TextField } from '@/components/forms/TextField';
import { useOnboarding } from '@/lib/onboarding/store';
import { onboardingHref } from '@/lib/onboarding/steps';

export default function WhyScreen() {
  const whyText = useOnboarding((s) => s.whyText);
  const set = useOnboarding((s) => s.set);

  return (
    <OnboardingStep
      step={9}
      title="Why does this matter to you?"
      subtitle="A sentence is enough. We'll remind you when it's hard."
      onSkip={() => router.push(onboardingHref('body') as never)}
    >
      <TextField
        placeholder="Tell us in your own words…"
        value={whyText}
        onChangeText={(t) => set({ whyText: t })}
        multiline
      />
    </OnboardingStep>
  );
}
