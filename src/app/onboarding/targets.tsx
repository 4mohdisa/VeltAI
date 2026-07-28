// Targets — shows the derived calorie + macro plan (identical maths to the
// backend). Users can accept it or adjust the calorie target in a bottom sheet;
// macros stay derived display (only the calorie target is persisted).
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, TextField } from '@/components/forms';
import { Badge } from '@/components/display';
import { HealthDisclaimer } from '@/components/display/HealthDisclaimer';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Text } from '@/components/primitives/Text';
import { DEFAULT_HEIGHT_CM, DEFAULT_WEIGHT_KG, deriveTargets } from '@/lib/onboarding/deriveTargets';
import { clampCalories } from '@/lib/settings/store';
import { navigate } from '@/lib/nav';
import { color, space } from '@/lib/design/tokens';
import { useOnboardingStore } from '@/lib/stores/onboarding';

type Macros = { calories: number; protein: number; carbs: number; fat: number };

const parseNum = (text: string, fallback: number): number => {
  const n = parseInt(text, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export default function TargetsScreen() {
  const age = useOnboardingStore((s) => s.age);
  const sex = useOnboardingStore((s) => s.sex);
  const heightCm = useOnboardingStore((s) => s.height_cm);
  const weightKg = useOnboardingStore((s) => s.weight_kg);
  const activity = useOnboardingStore((s) => s.activity_level);
  const goal = useOnboardingStore((s) => s.goal);
  const setCalorieTarget = useOnboardingStore((s) => s.setCalorieTarget);

  const derived = useMemo(
    () =>
      deriveTargets({
        age: age ?? 30,
        sex: sex ?? 'other',
        height_cm: heightCm ?? DEFAULT_HEIGHT_CM,
        weight_kg: weightKg ?? DEFAULT_WEIGHT_KG,
        activity_level: activity ?? 'sedentary',
        goal: goal ?? 'track',
      }),
    [age, sex, heightCm, weightKg, activity, goal],
  );

  const [macros, setMacros] = useState<Macros>(() => ({
    calories: derived.calories,
    protein: derived.protein,
    carbs: derived.carbs,
    fat: derived.fat,
  }));

  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const openSheet = () => {
    setDraft(String(macros.calories));
    setSheetOpen(true);
  };

  const saveSheet = () => {
    // Calorie safety (1.4.1): manual adjustments stay inside the same band
    // the server enforces — never store a starvation-level target.
    const calories = clampCalories(parseNum(draft, macros.calories));
    setMacros((m) => ({ ...m, calories }));
    setCalorieTarget(calories);
    setSheetOpen(false);
  };

  return (
    <OnbScaffold
      step={9}
      title="Your daily target"
      footer={
        <View style={{ gap: space.md }}>
          <Button title="Looks right — let's go" onPress={() => navigate('/onboarding/paywall')} />
          <Button title="Adjust manually" variant="secondary" onPress={openSheet} />
        </View>
      }
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
        <Text variant="statHero" color={color.label}>
          {macros.calories.toLocaleString()} kcal
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm }}>
          <Badge label={`${macros.protein}g protein`} />
          <Badge label={`${macros.carbs}g carbs`} />
          <Badge label={`${macros.fat}g fat`} />
        </View>
        {/* Guideline 1.4.1 — computed health targets need a visible disclaimer. */}
        <HealthDisclaimer />
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Adjust your calorie target"
      >
        <Text variant="footnote" color={color.secondaryLabel}>
          Protein, carbs and fat are set from your profile.
        </Text>
        <TextField
          label="Calories"
          value={draft}
          onChangeText={setDraft}
          keyboardType="number-pad"
        />
        <Button title="Save" onPress={saveSheet} />
      </BottomSheet>
    </OnbScaffold>
  );
}
