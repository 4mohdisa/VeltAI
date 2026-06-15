// A14 · Your cuisines
// Favourite cuisines (multi-select chips) + cooks-at-home segmented control.
// Critical for AI food accuracy.
import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { MultiSelectField } from '@/components/forms/MultiSelectField';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { useOnboarding, type CookStyle } from '@/lib/onboarding/store';

const CUISINES = [
  'Pakistani',
  'Indian',
  'Mediterranean',
  'Italian',
  'Mexican',
  'Japanese',
  'Chinese',
  'Thai',
  'Middle Eastern',
  'American',
  'Australian',
  'Other',
].map((c) => ({ label: c, value: c.toLowerCase().replace(/\s+/g, '-') }));

export default function CuisinesScreen() {
  const { cuisines, cooksAtHome } = useOnboarding();
  const set = useOnboarding((s) => s.set);

  return (
    <OnboardingStep
      step={14}
      title="What do you actually eat?"
      subtitle="We'll suggest food you'll genuinely want."
      continueDisabled={cuisines.length === 0}
    >
      <MultiSelectField
        label="Favourite cuisines"
        options={CUISINES}
        selected={cuisines}
        onChange={(v) => set({ cuisines: v })}
      />
      <SegmentedField<CookStyle>
        label="Do you cook at home?"
        value={cooksAtHome}
        onChange={(v) => set({ cooksAtHome: v })}
        options={[
          { label: 'Cook', value: 'cook' },
          { label: 'Eat out', value: 'eat-out' },
          { label: 'Both', value: 'both' },
        ]}
      />
    </OnboardingStep>
  );
}
