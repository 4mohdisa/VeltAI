// A13 · Your eating
// Meals/day stepper, dietary restrictions chips, allergies chips.
import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { MultiSelectField } from '@/components/forms/MultiSelectField';
import { Stepper } from '@/components/forms/Stepper';
import { useOnboarding } from '@/lib/onboarding/store';

const RESTRICTIONS = [
  { label: 'Halal', value: 'halal' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Gluten-free', value: 'gluten-free' },
  { label: 'Dairy-free', value: 'dairy-free' },
  { label: 'Pescatarian', value: 'pescatarian' },
];

const ALLERGIES = [
  { label: 'Nuts', value: 'nuts' },
  { label: 'Shellfish', value: 'shellfish' },
  { label: 'Eggs', value: 'eggs' },
  { label: 'Soy', value: 'soy' },
  { label: 'Dairy', value: 'dairy' },
];

export default function EatingScreen() {
  const { mealsPerDay, restrictions, allergies } = useOnboarding();
  const set = useOnboarding((s) => s.set);

  return (
    <OnboardingStep step={13} title="How do you eat?" subtitle="So your plan fits your plate.">
      <Stepper label="Meals per day" value={mealsPerDay} min={1} max={6} onChange={(v) => set({ mealsPerDay: v })} />
      <MultiSelectField
        label="Dietary restrictions"
        options={RESTRICTIONS}
        selected={restrictions}
        onChange={(v) => set({ restrictions: v })}
      />
      <MultiSelectField
        label="Allergies"
        options={ALLERGIES}
        selected={allergies}
        onChange={(v) => set({ allergies: v })}
      />
    </OnboardingStep>
  );
}
