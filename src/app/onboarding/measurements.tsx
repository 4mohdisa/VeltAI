// Measurements — the only free-text step. Age, sex, height and weight are ALL
// required: they feed Mifflin–St Jeor directly, and the population medians that
// used to stand in for a skipped height/weight invented body data and presented
// the resulting calorie target as the user's own (decided 2026-08-08). Inputs
// display in the user's chosen unit but are stored canonically in cm / kg.
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, SegmentedField, TextField } from '@/components/forms';
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

  /**
   * Switching kg↔lb CONVERTS what is already typed.
   *
   * Pre-fix the text was left alone, so the same digits were silently
   * reinterpreted in the new unit: type 70 as kg, flip to lb, and the stored
   * weight became 31.8 kg — a number the user never entered, feeding straight
   * into BMR and the calorie target (audit 2026-08-08).
   *
   * Display keeps one decimal. That is a real (small) round-trip loss —
   * 70 kg → 154.3 lb → 70.0 kg holds, but odd values can settle ±0.1 kg —
   * which is far below the precision of any bathroom scale and vastly
   * preferable to reinterpreting the digits.
   */
  const changeWeightUnit = (next: WeightUnit) => {
    if (next === weightUnit) return;
    const convert = (text: string): string => {
      const n = parseFloat(text);
      if (!Number.isFinite(n) || n <= 0) return text;
      return String(round1(next === 'lb' ? n / 0.453592 : n * 0.453592));
    };
    setWeightText(convert(weightText));
    setTargetText(convert(targetText));
    setWeightUnit(next);
  };

  /** Same rule for height: cm↔ft/in carries the value across. */
  const changeHeightUnit = (next: HeightUnit) => {
    if (next === heightUnit) return;
    if (next === 'ftin') {
      const cm = parseFloat(heightCmText);
      if (Number.isFinite(cm) && cm > 0) {
        const totalIn = cm / 2.54;
        setFeetText(String(Math.floor(totalIn / 12)));
        setInchesText(String(Math.round(totalIn % 12)));
      }
    } else {
      const cm = heightToCm();
      if (cm != null) setHeightCmText(String(cm));
    }
    setHeightUnit(next);
  };

  // Persist as the user types, not only on Continue. The store is written to
  // secure-store, so this is what makes a reload mid-form come back with the
  // answers still in the boxes — previously nothing was saved until Continue
  // succeeded, so anything typed and not submitted died with the reload
  // (audit 2026-08-08). Values are stored canonically (cm / kg); range errors
  // are surfaced separately, so a half-typed number persists rather than
  // being discarded.
  useEffect(() => {
    const typedAge = parseInt(ageText, 10);
    setMeasurements({
      age: Number.isFinite(typedAge) ? typedAge : null,
      sex: sexValue === '' ? null : sexValue,
      height_cm: heightToCm(),
      weight_kg: toKg(weightText),
      target_weight_kg: showTarget ? toKg(targetText) : null,
    });
    // heightToCm/toKg close over the unit toggles, so those are dependencies too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageText, sexValue, heightCmText, feetText, inchesText, weightText, targetText, heightUnit, weightUnit, showTarget]);

  // `submitted` flips on the first Continue press. Before it, only fields the
  // user has actually filled in show errors (no shouting at an untouched
  // form); after it, REQUIRED-but-empty fields show their reason too.
  //
  // Continue is never disabled. A disabled button was the whole of symptom 2
  // in the 2026-08-08 agent run: the user tapped it on an incomplete form and
  // got nothing — no navigation, no message, no toast — with no way to tell
  // which field was at fault (audit 2026-08-08).
  const [submitted, setSubmitted] = useState(false);

  // Light range validation (inline, per-field). Optional fields only validate
  // when non-empty — but unparseable input must never silently become the
  // population default, so out-of-range/garbage blocks Continue.
  //
  // The band matches the SERVER exactly (13..120, backend/internal/goals):
  // a client stricter than the server silently refuses input the API accepts,
  // and a client looser than the server produces the 400 it is meant to
  // prevent.
  const ageNum = parseInt(ageText, 10);
  const ageError =
    ageText.trim() === ''
      ? submitted
        ? 'Enter your age'
        : undefined
      : !Number.isFinite(ageNum) || ageNum < 13 || ageNum > 120
        ? 'Enter an age between 13 and 120'
        : undefined;

  const sexError = sexValue === '' && submitted ? 'Choose one so your targets are accurate' : undefined;

  const heightEmpty =
    heightUnit === 'cm' ? heightCmText.trim() === '' : feetText.trim() === '' && inchesText.trim() === '';
  const weightEmpty = weightText.trim() === '';

  const heightError = (() => {
    if (heightEmpty) return submitted ? 'Enter your height' : undefined;
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
    if (weightEmpty) return submitted ? 'Enter your weight' : undefined;
    const kg = toKg(weightText);
    return kg != null && kg >= 30 && kg <= 300
      ? undefined
      : weightUnit === 'kg'
        ? 'Enter a weight between 30 and 300 kg'
        : 'Enter a weight between 66 and 661 lb';
  })();

  // Height and weight are REQUIRED as of 2026-08-08: they feed BMR directly,
  // and substituting a population median invented the user's body data.
  const blocked =
    ageText.trim() === '' ||
    sexValue === '' ||
    heightEmpty ||
    weightEmpty ||
    !!ageError ||
    !!heightError ||
    !!weightError;

  const handleContinue = () => {
    // Always reveal the reason first. Pressing Continue on an incomplete form
    // now marks it submitted, which renders the specific message under each
    // offending field, instead of the press doing nothing at all.
    if (blocked) {
      setSubmitted(true);
      return;
    }
    const ageNum = parseInt(ageText, 10);
    setMeasurements({
      age: Number.isFinite(ageNum) ? ageNum : null,
      // Narrowed to a real Sex by the `blocked` guard above — the flow can no
      // longer reach here with an unanswered sex.
      sex: sexValue,
      height_cm: heightToCm(),
      weight_kg: toKg(weightText),
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
      footer={<Button title="Continue" onPress={handleContinue} />}
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
          error={sexError}
        />

        <View style={{ gap: space.sm }}>
          <SegmentedField<HeightUnit>
            label="Height"
            options={[
              { label: 'cm', value: 'cm' },
              { label: 'ft / in', value: 'ftin' },
            ]}
            value={heightUnit}
            onChange={changeHeightUnit}
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
            onChange={changeWeightUnit}
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
