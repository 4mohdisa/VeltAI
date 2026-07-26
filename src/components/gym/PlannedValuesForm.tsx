// PlannedValuesForm — the "set planned values" form shown inside the exercise
// picker once an exercise is chosen. Strength shows sets/reps/weight; cardio
// swaps reps+weight for a duration field. Every field degrades to undefined when
// left blank so the caller only sends what the user actually set.
import type { JSX } from 'react';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, SegmentedField, Stepper, TextField } from '@/components/forms';
import { space } from '@/lib/design/tokens';
import type { ExerciseLibraryItem } from '@/lib/types';

export type PlannedValues = {
  sets?: number;
  reps?: number;
  weight?: number;
  weight_unit?: string;
  duration_minutes?: number;
  rest_seconds?: number;
};

const UNIT_OPTIONS: { label: string; value: 'kg' | 'lb' }[] = [
  { label: 'kg', value: 'kg' },
  { label: 'lb', value: 'lb' },
];

// Parse a numeric text field; blank / non-numeric → undefined (field unset).
function toNum(s: string): number | undefined {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

export function PlannedValuesForm({
  exercise,
  initial,
  onSubmit,
}: {
  exercise: ExerciseLibraryItem;
  initial?: PlannedValues;
  onSubmit: (v: PlannedValues) => void;
}): JSX.Element {
  const isCardio = exercise.exercise_type === 'cardio';

  const [sets, setSets] = useState<number>(initial?.sets ?? 3);
  const [reps, setReps] = useState<string>(initial?.reps != null ? String(initial.reps) : '10');
  const [weight, setWeight] = useState<string>(initial?.weight != null ? String(initial.weight) : '');
  const [unit, setUnit] = useState<'kg' | 'lb'>(initial?.weight_unit === 'lb' ? 'lb' : 'kg');
  const [duration, setDuration] = useState<string>(
    initial?.duration_minutes != null ? String(initial.duration_minutes) : '',
  );
  const [rest, setRest] = useState<string>(initial?.rest_seconds != null ? String(initial.rest_seconds) : '');

  const submit = () => {
    const rest_seconds = toNum(rest);
    if (isCardio) {
      onSubmit({ sets, duration_minutes: toNum(duration), rest_seconds });
      return;
    }
    const w = toNum(weight);
    onSubmit({
      sets,
      reps: toNum(reps),
      weight: w,
      weight_unit: w !== undefined ? unit : undefined,
      rest_seconds,
    });
  };

  return (
    <View style={{ gap: space.lg }}>
      <Stepper label="Sets" value={sets} min={1} max={20} onChange={setSets} />

      {!isCardio ? (
        <TextField label="Reps" value={reps} onChangeText={setReps} keyboardType="number-pad" placeholder="10" />
      ) : null}

      {!isCardio ? (
        <TextField
          label="Weight (optional)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="—"
        />
      ) : null}

      {!isCardio ? (
        <SegmentedField<'kg' | 'lb'> label="Unit" options={UNIT_OPTIONS} value={unit} onChange={setUnit} />
      ) : null}

      {isCardio ? (
        <TextField
          label="Duration (min)"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          placeholder="20"
        />
      ) : null}

      <TextField
        label="Rest (sec, optional)"
        value={rest}
        onChangeText={setRest}
        keyboardType="number-pad"
        placeholder="—"
      />

      <Button title="Add to Template" onPress={submit} />
    </View>
  );
}
