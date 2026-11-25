// Measurements — the only free-text step. Age, sex, height and weight are ALL
// required: they feed Mifflin–St Jeor directly, and the population medians that
// used to stand in for a skipped height/weight invented body data and presented
// the resulting calorie target as the user's own (decided 2026-08-08). Inputs
// display in the user's chosen unit but are stored canonically in cm / kg.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, SegmentedField, TextField } from '@/components/forms';
import { navigate } from '@/lib/nav';
import { space } from '@/lib/design/tokens';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import type { Sex } from '@/lib/types';

type HeightUnit = 'cm' | 'ftin';
type WeightUnit = 'kg' | 'lb';

const SEX_OPTIONS = [
  { labelKey: 'onboarding.measurements.sexMale', value: 'male' },
  { labelKey: 'onboarding.measurements.sexFemale', value: 'female' },
  { labelKey: 'onboarding.measurements.sexOther', value: 'other' },
] as const satisfies readonly { labelKey: string; value: Sex }[];

const round1 = (n: number) => Math.round(n * 10) / 10;

export default function MeasurementsScreen() {
  const { t } = useTranslation();
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
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(
    () => useOnboardingStore.getState().height_unit ?? 'cm',
  );
  const [heightCmText, setHeightCmText] = useState(() => {
    const h = useOnboardingStore.getState().height_cm;
    return h != null ? String(h) : '';
  });
  // The raw ft/in the user typed, restored verbatim. Recomputing them from cm
  // on remount changed the digits under the user (audit 2026-08-08).
  const [feetText, setFeetText] = useState(() => useOnboardingStore.getState().height_ft_text ?? '');
  const [inchesText, setInchesText] = useState(() => useOnboardingStore.getState().height_in_text ?? '');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    () => useOnboardingStore.getState().weight_unit ?? 'kg',
  );
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
  // being discarded. The canonical values are worked out here, in render, so
  // the effect depends on plain values rather than on the unit-aware helpers.
  const typedAge = parseInt(ageText, 10);
  const draftAge = Number.isFinite(typedAge) ? typedAge : null;
  const draftHeightCm = heightToCm();
  const draftWeightKg = toKg(weightText);
  const draftTargetKg = showTarget ? toKg(targetText) : null;
  useEffect(() => {
    setMeasurements({
      age: draftAge,
      sex: sexValue === '' ? null : sexValue,
      height_cm: draftHeightCm,
      weight_kg: draftWeightKg,
      target_weight_kg: draftTargetKg,
      // Display state — never sent, only used to redraw the form as left.
      height_unit: heightUnit,
      weight_unit: weightUnit,
      height_ft_text: heightUnit === 'ftin' ? feetText : null,
      height_in_text: heightUnit === 'ftin' ? inchesText : null,
    });
  }, [setMeasurements, draftAge, sexValue, draftHeightCm, draftWeightKg, draftTargetKg, heightUnit, weightUnit, feetText, inchesText]);

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
  const ageError =
    ageText.trim() === ''
      ? submitted
        ? t('onboarding.measurements.ageRequired')
        : undefined
      : !Number.isFinite(typedAge) || typedAge < 13 || typedAge > 120
        ? t('onboarding.measurements.ageRange', { min: 13, max: 120 })
        : undefined;

  const sexError = sexValue === '' && submitted ? t('onboarding.measurements.sexRequired') : undefined;

  const heightEmpty =
    heightUnit === 'cm' ? heightCmText.trim() === '' : feetText.trim() === '' && inchesText.trim() === '';
  const weightEmpty = weightText.trim() === '';

  const heightError = (() => {
    if (heightEmpty) return submitted ? t('onboarding.measurements.heightRequired') : undefined;
    if (heightUnit === 'cm') {
      if (heightCmText.trim() === '') return undefined;
      const n = parseFloat(heightCmText);
      return Number.isFinite(n) && n >= 100 && n <= 250
        ? undefined
        : t('onboarding.measurements.heightRangeCm', { min: 100, max: 250 });
    }
    if (feetText.trim() === '' && inchesText.trim() === '') return undefined;
    return draftHeightCm != null && draftHeightCm >= 100 && draftHeightCm <= 250
      ? undefined
      : t('onboarding.measurements.heightRangeFt', { min: 3, max: 8 });
  })();

  const weightError = (() => {
    if (weightEmpty) return submitted ? t('onboarding.measurements.weightRequired') : undefined;
    return draftWeightKg != null && draftWeightKg >= 30 && draftWeightKg <= 300
      ? undefined
      : weightUnit === 'kg'
        ? t('onboarding.measurements.weightRangeKg', { min: 30, max: 300 })
        : t('onboarding.measurements.weightRangeLb', { min: 66, max: 661 });
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
    setMeasurements({
      age: draftAge,
      // Narrowed to a real Sex by the `blocked` guard above — the flow can no
      // longer reach here with an unanswered sex.
      sex: sexValue,
      height_cm: draftHeightCm,
      weight_kg: draftWeightKg,
      target_weight_kg: draftTargetKg,
    });
    navigate('/onboarding/body-type');
  };

  return (
    <OnbScaffold
      step={7}
      scroll
      title={t('onboarding.measurements.title')}
      subtitle={t('onboarding.measurements.subtitle')}
      footer={<Button title={t('onboarding.measurements.continue')} onPress={handleContinue} />}
    >
      <View style={{ gap: space.xl }}>
        <TextField
          label={t('onboarding.measurements.ageLabel')}
          value={ageText}
          onChangeText={setAgeText}
          keyboardType="number-pad"
          placeholder={t('onboarding.measurements.agePlaceholder')}
          error={ageError}
        />

        <SegmentedField<Sex | ''>
          label={t('onboarding.measurements.sexLabel')}
          options={SEX_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value }))}
          value={sexValue}
          onChange={setSexValue}
          error={sexError}
        />

        <View style={{ gap: space.sm }}>
          <SegmentedField<HeightUnit>
            label={t('onboarding.measurements.heightLabel')}
            options={[
              { label: t('onboarding.measurements.unitCm'), value: 'cm' },
              { label: t('onboarding.measurements.unitFtIn'), value: 'ftin' },
            ]}
            value={heightUnit}
            onChange={changeHeightUnit}
          />
          {heightUnit === 'cm' ? (
            <TextField
              value={heightCmText}
              onChangeText={setHeightCmText}
              keyboardType="decimal-pad"
              placeholder={t('onboarding.measurements.heightCmPlaceholder')}
              accessibilityLabel={t('onboarding.measurements.heightCmA11y')}
              error={heightError}
            />
          ) : (
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <TextField
                  value={feetText}
                  onChangeText={setFeetText}
                  keyboardType="number-pad"
                  placeholder={t('onboarding.measurements.heightFeetPlaceholder')}
                  accessibilityLabel={t('onboarding.measurements.heightFeetA11y')}
                  error={heightError}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  value={inchesText}
                  onChangeText={setInchesText}
                  keyboardType="number-pad"
                  placeholder={t('onboarding.measurements.heightInchesPlaceholder')}
                  accessibilityLabel={t('onboarding.measurements.heightInchesA11y')}
                />
              </View>
            </View>
          )}
        </View>

        <View style={{ gap: space.sm }}>
          <SegmentedField<WeightUnit>
            label={t('onboarding.measurements.weightLabel')}
            options={[
              { label: t('onboarding.measurements.unitKg'), value: 'kg' },
              { label: t('onboarding.measurements.unitLb'), value: 'lb' },
            ]}
            value={weightUnit}
            onChange={changeWeightUnit}
          />
          <TextField
            value={weightText}
            onChangeText={setWeightText}
            keyboardType="decimal-pad"
            placeholder={t(
              weightUnit === 'kg'
                ? 'onboarding.measurements.weightKgPlaceholder'
                : 'onboarding.measurements.weightLbPlaceholder',
            )}
            accessibilityLabel={t(
              weightUnit === 'kg' ? 'onboarding.measurements.weightKgA11y' : 'onboarding.measurements.weightLbA11y',
            )}
            error={weightError}
          />
        </View>

        {showTarget ? (
          <TextField
            label={t('onboarding.measurements.targetLabel', {
              unit: t(weightUnit === 'kg' ? 'onboarding.measurements.unitKg' : 'onboarding.measurements.unitLb'),
            })}
            value={targetText}
            onChangeText={setTargetText}
            keyboardType="decimal-pad"
            placeholder={t(
              weightUnit === 'kg'
                ? 'onboarding.measurements.targetKgPlaceholder'
                : 'onboarding.measurements.targetLbPlaceholder',
            )}
          />
        ) : null}
      </View>
    </OnbScaffold>
  );
}
