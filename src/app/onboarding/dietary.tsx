// Dietary — multi-select pills. "None" is mutually exclusive with the rest:
// picking it clears the others, picking anything else clears "None".
import { useTranslation } from 'react-i18next';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, MultiSelectField } from '@/components/forms';
import { navigate } from '@/lib/nav';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { DietaryRequirement } from '@/lib/types';

// Labels live in onboarding.dietary.options, keyed by these values.
const DIETARY = [
  'halal',
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'none',
] as const satisfies readonly DietaryRequirement[];

export default function DietaryScreen() {
  const { t } = useTranslation();
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
      title={t('onboarding.dietary.title')}
      subtitle={t('onboarding.dietary.subtitle')}
      footer={<Button title={t('onboarding.measurements.continue')} onPress={() => navigate('/onboarding/preview')} />}
    >
      <MultiSelectField
        options={DIETARY.map((value) => ({ label: t(`onboarding.dietary.options.${value}`), value }))}
        selected={dietary}
        onChange={handleChange}
      />
    </OnbScaffold>
  );
}
