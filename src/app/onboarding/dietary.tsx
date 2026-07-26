// Dietary — multi-select pills. "None" is mutually exclusive with the rest:
// picking it clears the others, picking anything else clears "None".
import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, MultiSelectField } from '@/components/forms';
import { navigate } from '@/lib/nav';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { DietaryRequirement } from '@/lib/types';

const DIETARY: { label: string; value: DietaryRequirement }[] = [
  { label: 'Halal', value: 'halal' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Gluten-free', value: 'gluten_free' },
  { label: 'Dairy-free', value: 'dairy_free' },
  { label: 'None', value: 'none' },
];

export default function DietaryScreen() {
  const dietary = useOnboardingStore((s) => s.dietary_requirements);
  const setDietaryReqs = useOnboardingStore((s) => s.setDietaryReqs);

  const handleChange = (next: string[]) => {
    const added = next.find((v) => !dietary.includes(v as DietaryRequirement));
    const result =
      added === 'none' ? ['none'] : added ? next.filter((v) => v !== 'none') : next;
    setDietaryReqs(result as DietaryRequirement[]);
  };

  return (
    <OnbScaffold
      step={4}
      title="Any dietary requirements?"
      subtitle="We'll filter your food database accordingly"
      footer={<Button title="Continue" onPress={() => navigate('/onboarding/preview')} />}
    >
      <MultiSelectField options={DIETARY} selected={dietary} onChange={handleChange} />
    </OnbScaffold>
  );
}
