// Targets — shows the derived calorie + macro plan (identical maths to the
// backend). Users can accept it or fine-tune the four numbers in a bottom sheet.
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, TextField } from '@/components/forms';
import { Badge } from '@/components/display';
import { HealthDisclaimer } from '@/components/display/HealthDisclaimer';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Text } from '@/components/primitives/Text';
import { DEFAULT_HEIGHT_CM, DEFAULT_WEIGHT_KG, deriveTargets } from '@/lib/onboarding/deriveTargets';
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
  const [draft, setDraft] = useState<Record<keyof Macros, string>>({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const openSheet = () => {
    setDraft({
      calories: String(macros.calories),
      protein: String(macros.protein),
      carbs: String(macros.carbs),
      fat: String(macros.fat),
    });
    setSheetOpen(true);
  };

  const saveSheet = () => {
    const next: Macros = {
      calories: parseNum(draft.calories, macros.calories),
      protein: parseNum(draft.protein, macros.protein),
      carbs: parseNum(draft.carbs, macros.carbs),
      fat: parseNum(draft.fat, macros.fat),
    };
    setMacros(next);
    setCalorieTarget(next.calories);
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

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Adjust your targets">
        <TextField
          label="Calories"
          value={draft.calories}
          onChangeText={(t) => setDraft((d) => ({ ...d, calories: t }))}
          keyboardType="number-pad"
        />
        <TextField
          label="Protein (g)"
          value={draft.protein}
          onChangeText={(t) => setDraft((d) => ({ ...d, protein: t }))}
          keyboardType="number-pad"
        />
        <TextField
          label="Carbs (g)"
          value={draft.carbs}
          onChangeText={(t) => setDraft((d) => ({ ...d, carbs: t }))}
          keyboardType="number-pad"
        />
        <TextField
          label="Fat (g)"
          value={draft.fat}
          onChangeText={(t) => setDraft((d) => ({ ...d, fat: t }))}
          keyboardType="number-pad"
        />
        <Button title="Save" onPress={saveSheet} />
      </BottomSheet>
    </OnbScaffold>
  );
}
