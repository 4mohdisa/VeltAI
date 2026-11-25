// Dietary — multi-select pills. "None" is mutually exclusive with the rest:
// picking it clears the others, picking anything else clears "None".
import { useTranslation } from 'react-i18next';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, MultiSelectField } from '@/components/forms';
import { navigate } from '@/lib/nav';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { DIETARY, nextDietary } from '@/components/onboarding/dietary';

export default function DietaryScreen() {
  const { t } = useTranslation();
  const dietary = useOnboardingStore((s) => s.dietary_requirements);
  const setDietaryReqs = useOnboardingStore((s) => s.setDietaryReqs);

  const handleChange = (next: string[]) => setDietaryReqs(nextDietary(dietary, next));

  return (
    <OnbScaffold
      step={5}
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
