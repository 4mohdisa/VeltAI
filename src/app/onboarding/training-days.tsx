// Training days — single-select with a preselected default (3 to 4 days), so
// Continue is always enabled. Stored only: no plan input reads it yet.
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/forms';
import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { haptics } from '@/lib/haptics';
import { navigate } from '@/lib/nav';
import { space } from '@/lib/design/tokens';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { TrainingDays } from '@/lib/types';

// Labels live in onboarding.trainingDays.options, keyed by these values.
const DAYS = ['days_0', 'days_1_2', 'days_3_4', 'days_5_plus'] as const satisfies readonly TrainingDays[];

export default function TrainingDaysScreen() {
  const { t } = useTranslation();
  const trainingDays = useOnboardingStore((s) => s.training_days);
  const setTrainingDays = useOnboardingStore((s) => s.setTrainingDays);

  const pick = (value: TrainingDays) => {
    setTrainingDays(value);
    haptics.selection();
  };

  return (
    <OnbScaffold
      step={3}
      title={t('onboarding.trainingDays.title')}
      footer={<Button title={t('onboarding.measurements.continue')} onPress={() => navigate('/onboarding/cuisine')} />}
    >
      <View style={{ gap: space.md }}>
        {DAYS.map((value, i) => (
          <OptionCard
            key={value}
            label={t(`onboarding.trainingDays.options.${value}`)}
            selected={trainingDays === value}
            onPress={() => pick(value)}
            delay={i * 60}
          />
        ))}
      </View>
    </OnbScaffold>
  );
}
