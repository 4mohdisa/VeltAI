// A10 · About you (body)
// Four inputs on one screen: weight slider, height slider, age stepper, sex
// segmented control. Units toggle at the top.
import { OnboardingStep } from '@/components/domain/OnboardingStep';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { SliderField } from '@/components/forms/SliderField';
import { Stepper } from '@/components/forms/Stepper';
import { useOnboarding, type Sex, type Units } from '@/lib/onboarding/store';

export default function BodyScreen() {
  const { weight, height, age, sex, units } = useOnboarding();
  const set = useOnboarding((s) => s.set);
  const metric = units === 'metric';

  return (
    <OnboardingStep step={10} title="About you" subtitle="This sets your calorie and macro targets.">
      <SegmentedField<Units>
        label="Units"
        value={units}
        onChange={(v) => set({ units: v })}
        options={[
          { label: 'Metric', value: 'metric' },
          { label: 'Imperial', value: 'imperial' },
        ]}
      />

      <SliderField
        label="Weight"
        value={weight}
        min={40}
        max={160}
        step={1}
        onValueChange={(v) => set({ weight: v })}
        formatValue={(v) => (metric ? `${v} kg` : `${Math.round(v * 2.205)} lb`)}
      />

      <SliderField
        label="Height"
        value={height}
        min={140}
        max={210}
        step={1}
        onValueChange={(v) => set({ height: v })}
        formatValue={(v) => (metric ? `${v} cm` : `${Math.floor((v / 2.54) / 12)}ft ${Math.round((v / 2.54) % 12)}in`)}
      />

      <Stepper label="Age" value={age} min={13} max={100} onChange={(v) => set({ age: v })} />

      <SegmentedField<Sex>
        label="Sex"
        value={sex}
        onChange={(v) => set({ sex: v })}
        options={[
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Other', value: 'other' },
        ]}
      />
    </OnboardingStep>
  );
}
