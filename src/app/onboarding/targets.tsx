// Targets — shows the derived calorie + macro plan (identical maths to the
// backend). Users can accept it or adjust the calorie target in a bottom sheet;
// the macros are split from that target (only the calorie target is persisted).
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, TextField } from '@/components/forms';
import { Badge } from '@/components/display';
import { HealthDisclaimer } from '@/components/display/HealthDisclaimer';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Text } from '@/components/primitives/Text';
import { calorieFloor, deriveTargets } from '@/lib/onboarding/deriveTargets';
import { CALORIE_TARGET_MAX, clampCalories } from '@/lib/settings/store';
import { formatNumber } from '@/lib/formatting';
import { navigate } from '@/lib/nav';
import { color, space } from '@/lib/design/tokens';
import { useOnboardingStore } from '@/lib/stores/onboarding';

export default function TargetsScreen() {
  const { t } = useTranslation();
  const age = useOnboardingStore((s) => s.age);
  const sex = useOnboardingStore((s) => s.sex);
  const heightCm = useOnboardingStore((s) => s.height_cm);
  const weightKg = useOnboardingStore((s) => s.weight_kg);
  const activity = useOnboardingStore((s) => s.activity_level);
  const goal = useOnboardingStore((s) => s.goal);
  const calorieTarget = useOnboardingStore((s) => s.calorie_target);
  const setCalorieTarget = useOnboardingStore((s) => s.setCalorieTarget);

  const macros = useMemo(
    () =>
      deriveTargets({
        age: age ?? 30,
        sex: sex ?? 'other',
        // No fallback: measurements (step 8) requires both, so by step 10 they
        // exist. A `??` here would quietly resurrect the median substitution
        // this screen exists to display honestly.
        height_cm: heightCm ?? 0,
        weight_kg: weightKg ?? 0,
        activity_level: activity ?? 'sedentary',
        goal: goal ?? 'track',
        calorie_target: calorieTarget,
      }),
    [age, sex, heightCm, weightKg, activity, goal, calorieTarget],
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | undefined>();

  const openSheet = () => {
    setDraft(String(macros.calories));
    setDraftError(undefined);
    setSheetOpen(true);
  };

  const saveSheet = () => {
    // Calorie safety (1.4.1): manual adjustments stay inside the same band
    // the server enforces — never store a starvation-level target. The sex
    // comes from the ONBOARDING store: the profile store still holds its
    // default here, and the server floors this submission on the sex the
    // onboarding POST carries, so anything else 400s the whole flow.
    // A value outside the band is refused with the range, never silently
    // replaced by the floor or ceiling.
    const typed = parseInt(draft, 10);
    const calories = clampCalories(typed, sex ?? 'other');
    if (calories !== typed) {
      setDraftError(
        t('onboarding.targets.caloriesRange', {
          min: formatNumber(calorieFloor(sex ?? 'other')),
          max: formatNumber(CALORIE_TARGET_MAX),
        }),
      );
      return;
    }
    setCalorieTarget(calories);
    setSheetOpen(false);
  };

  return (
    <OnbScaffold
      step={10}
      title={t('onboarding.targets.title')}
      footer={
        <View style={{ gap: space.md }}>
          <Button title={t('onboarding.targets.accept')} onPress={() => navigate('/onboarding/paywall')} />
          <Button title={t('onboarding.targets.adjust')} variant="secondary" onPress={openSheet} />
        </View>
      }
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
        <Text variant="statHero" color={color.label}>
          {t('labelScan.totalKcal', { kcal: formatNumber(macros.calories) })}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm }}>
          <Badge label={t('onboarding.targets.protein', { grams: macros.protein })} />
          <Badge label={t('onboarding.targets.carbs', { grams: macros.carbs })} />
          <Badge label={t('onboarding.targets.fat', { grams: macros.fat })} />
        </View>
        {/* Guideline 1.4.1 — computed health targets need a visible disclaimer. */}
        <HealthDisclaimer />
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('onboarding.targets.sheetTitle')}
      >
        <Text variant="footnote" color={color.secondaryLabel}>
          {t('onboarding.targets.sheetNote')}
        </Text>
        <TextField
          label={t('onboarding.targets.caloriesLabel')}
          value={draft}
          onChangeText={(text) => {
            setDraft(text);
            setDraftError(undefined);
          }}
          error={draftError}
          keyboardType="number-pad"
        />
        <Button title={t('common.save')} onPress={saveSheet} />
      </BottomSheet>
    </OnbScaffold>
  );
}
