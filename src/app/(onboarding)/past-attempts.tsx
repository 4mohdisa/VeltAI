// A5 · What have you tried?
// Six multi-select cards. Calibration data for the AI — if they've bounced off
// many things, the first week is made more forgiving. Skip available.
import { router } from 'expo-router';

import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { MultiSelectField } from '@/components/forms/MultiSelectField';
import { useOnboarding } from '@/lib/onboarding/store';
import { onboardingHref } from '@/lib/onboarding/steps';

const OPTIONS = [
  { label: 'Gym memberships I stopped using', value: 'memberships' },
  { label: "Diet plans that didn't last", value: 'diets' },
  { label: 'Personal trainers', value: 'trainers' },
  { label: 'Other fitness or calorie apps', value: 'apps' },
  { label: 'Just willpower', value: 'willpower' },
  { label: 'Nothing yet — this is my first try', value: 'first-try' },
];

export default function PastAttemptsScreen() {
  const pastAttempts = useOnboarding((s) => s.pastAttempts);
  const set = useOnboarding((s) => s.set);

  return (
    <OnboardingStep
      step={5}
      title="What hasn't stuck so far?"
      subtitle="No judgement — this helps us make week one easier."
      onSkip={() => router.push(onboardingHref('frustrations') as never)}
    >
      <MultiSelectField options={OPTIONS} selected={pastAttempts} onChange={(v) => set({ pastAttempts: v })} />
    </OnboardingStep>
  );
}
