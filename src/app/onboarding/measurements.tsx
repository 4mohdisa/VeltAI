// Measurements — the only free-text step. Age + sex are required; height/weight
// are optional (population medians fill the gap so the preview and the POST
// payload agree). Inputs display in the user's chosen unit but are stored
// canonically in cm / kg.
import { useState } from 'react';
import { View } from 'react-native';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, SegmentedField, TextField } from '@/components/forms';
import { DEFAULT_HEIGHT_CM, DEFAULT_WEIGHT_KG } from '@/lib/onboarding/deriveTargets';
import { navigate } from '@/lib/nav';
import { space } from '@/lib/design/tokens';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { Sex } from '@/lib/types';

type HeightUnit = 'cm' | 'ftin';
type WeightUnit = 'kg' | 'lb';

const SEX_OPTIONS: { label: string; value: Sex | '' }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Prefer not to say', value: 'other' },
];

const round1 = (n: number) => Math.round(n * 10) / 10;

export default function MeasurementsScreen() {
  const setMeasurements = useOnboardingStore((s) => s.setMeasurements);
  const goal = useOnboardingStore((s) => s.goal);
  const showTarget = goal === 'lose' || goal === 'muscle';

  // Prefill once from the persisted store so back/forward preserves answers.
  const [ageText, setAgeText] = useState(() => {
    const a = useOnboardingStore.getState().age;
    return a != null ? String(a) : '';
  });
  const [sexValue, setSexValue] = useState<Sex | ''>(
    () => useOnboardingStore.getState().sex ?? '',
  );
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCmText, setHeightCmText] = useState(() => {
    const h = useOnboardingStore.getState().height_cm;
    return h != null ? String(h) : '';
  });
  const [feetText, setFeetText] = useState('');
  const [inchesText, setInchesText] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weightText, setWeightText] = useState(() => {
    const w = useOnboardingStore.getState().weight_kg;
    return w != null ? String(w) : '';
  });
  const [targetText, setTargetText] = useState(() => {
    const t = useOnboardingStore.getState().target_weight_kg;
    return t != null ? String(t) : '';
  });

  const heightToCm = (): number | null => {
    if (heightUnit === 'cm') {
      const n = parseFloat(heightCmText);
      return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    }
    const ft = parseFloat(feetText);
    const inch = parseFloat(inchesText);
    const total = (Number.isFinite(ft) ? ft : 0) * 12 + (Number.isFinite(inch) ? inch : 0);
    return total > 0 ? Math.round(total * 2.54) : null;
  };

  const toKg = (text: string): number | null => {
    const n = parseFloat(text);
    if (!Number.isFinite(n) || n <= 0) return null;
    return weightUnit === 'kg' ? round1(n) : round1(n * 0.453592);
  };

  // Light range validation (inline, per-field). Optional fields only validate
  // when non-empty — but unparseable input must never silently become the
  // population default, so out-of-range/garbage blocks Continue.
  const ageNum = parseInt(ageText, 10);
  const ageError =
    ageText.trim() !== '' && (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 100)
      ? 'Enter an age between 13 and 100'
      : undefined;

  const heightError = (() => {
    if (heightUnit === 'cm') {
      if (heightCmText.trim() === '') return undefined;
      const n = parseFloat(heightCmText);
      return Number.isFinite(n) && n >= 100 && n <= 250
        ? undefined
        : 'Enter a height between 100 and 250 cm';
    }
    if (feetText.trim() === '' && inchesText.trim() === '') return undefined;
    const cm = heightToCm();
    return cm != null && cm >= 100 && cm <= 250 ? undefined : 'Enter a height between 3 and 8 ft';
  })();

  const weightError = (() => {
    if (weightText.trim() === '') return undefined;
    const kg = toKg(weightText);
    return kg != null && kg >= 30 && kg <= 300
      ? undefined
      : weightUnit === 'kg'
        ? 'Enter a weight between 30 and 300 kg'
        : 'Enter a weight between 66 and 661 lb';
  })();

  const canContinue =
    ageText.trim() !== '' && sexValue !== '' && !ageError && !heightError && !weightError;

  const handleContinue = () => {
    const ageNum = parseInt(ageText, 10);
    setMeasurements({
      age: Number.isFinite(ageNum) ? ageNum : null,
      sex: sexValue === '' ? null : sexValue,
      height_cm: heightToCm() ?? DEFAULT_HEIGHT_CM,
      weight_kg: toKg(weightText) ?? DEFAULT_WEIGHT_KG,
      target_weight_kg: showTarget ? toKg(targetText) : null,
    });
    navigate('/onboarding/body-type');
  };

  return (
    <OnbScaffold
      step={7}
      scroll
      title="A few more details"
      subtitle="To calculate your personal targets"
      footer={<Button title="Continue" disabled={!canContinue} onPress={handleContinue} />}
    >
      <View style={{ gap: space.xl }}>
        <TextField
          label="Age"
          value={ageText}
          onChangeText={setAgeText}
          keyboardType="number-pad"
          placeholder="e.g. 28"
          error={ageError}
        />

        <SegmentedField<Sex | ''>
          label="Sex"
          options={SEX_OPTIONS}
          value={sexValue}
          onChange={setSexValue}
        />

        <View style={{ gap: space.sm }}>
          <SegmentedField<HeightUnit>
            label="Height"
            options={[
              { label: 'cm', value: 'cm' },
              { label: 'ft / in', value: 'ftin' },
            ]}
            value={heightUnit}
            onChange={setHeightUnit}
          />
          {heightUnit === 'cm' ? (
            <TextField
              value={heightCmText}
              onChangeText={setHeightCmText}
              keyboardType="decimal-pad"
              placeholder="170 cm"
              accessibilityLabel="Height in centimetres"
              error={heightError}
            />
          ) : (
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <TextField
                  value={feetText}
                  onChangeText={setFeetText}
                  keyboardType="number-pad"
                  placeholder="5 ft"
                  accessibilityLabel="Height, feet"
                  error={heightError}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  value={inchesText}
                  onChangeText={setInchesText}
                  keyboardType="number-pad"
                  placeholder="9 in"
                  accessibilityLabel="Height, inches"
                />
              </View>
            </View>
          )}
        </View>

        <View style={{ gap: space.sm }}>
          <SegmentedField<WeightUnit>
            label="Current weight"
            options={[
              { label: 'kg', value: 'kg' },
              { label: 'lb', value: 'lb' },
            ]}
            value={weightUnit}
            onChange={setWeightUnit}
          />
          <TextField
            value={weightText}
            onChangeText={setWeightText}
            keyboardType="decimal-pad"
            placeholder={weightUnit === 'kg' ? '70 kg' : '154 lb'}
            accessibilityLabel={
              weightUnit === 'kg' ? 'Current weight in kilograms' : 'Current weight in pounds'
            }
            error={weightError}
          />
        </View>

        {showTarget ? (
          <TextField
            label={`Target weight (${weightUnit})`}
            value={targetText}
            onChangeText={setTargetText}
            keyboardType="decimal-pad"
            placeholder={weightUnit === 'kg' ? '65 kg' : '143 lb'}
          />
        ) : null}
      </View>
    </OnbScaffold>
  );
}
