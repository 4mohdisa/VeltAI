// PlannedValuesForm — the "set planned values" form shown inside the exercise
// picker once an exercise is chosen. Strength shows sets/reps/weight; cardio
// swaps reps+weight for a duration field. Every field degrades to undefined when
// left blank so the caller only sends what the user actually set.
//
// The four planned values are typed through the shared NumberEntryBar, which is
// the design's one number-entry model: tap a value, the bar docks under its
// caption, "Done" closes it.
import type { JSX } from 'react';
import { useState } from 'react';
import { View } from 'react-native';

import { NumberEntryBar, type NumberEntryMode } from '@/components/common/NumberEntryBar';
import { Button, SegmentedField, TextField } from '@/components/forms';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, ROUNDED_FACE_BY_WEIGHT, space, surface } from '@/lib/design/tokens';
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

/** The design's value box: 40pt tall with a 16/20 rounded figure. No token
 *  covers either, as in the session screen's set rows. */
const VALUE_BOX_HEIGHT = 40;
const VALUE_FONT_SIZE = 16;
const VALUE_LINE_HEIGHT = 20;

/** The design's template pads — its captions and keyboards for the four planned
 *  values, capped at five digits as the design caps them. It also has a Target
 *  RPE pad, which this form has no field for. */
type PadField = 'sets' | 'reps' | 'weight' | 'rest';
const PADS: Record<PadField, { label: string; mode: NumberEntryMode }> = {
  sets: { label: 'Planned sets', mode: 'numeric' },
  reps: { label: 'Target reps', mode: 'numeric' },
  weight: { label: 'Target weight · kg', mode: 'decimal' },
  rest: { label: 'Rest · seconds', mode: 'numeric' },
};
const PAD_MAX_LENGTH = 5;

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
  // Which pad is open, and its raw entry string. One at a time, as the design does.
  const [pad, setPad] = useState<PadField | null>(null);
  const [entry, setEntry] = useState('');

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

  // Tapping the open value closes the bar, any other value switches it, and the
  // entry string always restarts empty.
  const startEdit = (field: PadField) => () => {
    setEntry('');
    setPad((open) => (open === field ? null : field));
  };

  // The bar writes the sanitised STRING into the same state the fields used to
  // fill, so an emptied value stays unset rather than becoming a 0. Sets is the
  // exception: it is held as a number and the stepper's floor of 1 still holds.
  const applyPad = (text: string, value: number) => {
    setEntry(text);
    if (pad === 'sets') setSets(Math.max(1, Math.round(value)));
    else if (pad === 'reps') setReps(text);
    else if (pad === 'weight') setWeight(text);
    else if (pad === 'rest') setRest(text);
  };

  // A labelled row: the field name, then the design's tappable value box, which
  // lights up while its own pad is open.
  const padRow = (field: PadField, label: string, value: string, suffix: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <Text
        variant="label"
        color={color.secondaryLabel}
        style={{ flex: 1, letterSpacing: 1.1, textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      <Pressable
        onPress={startEdit(field)}
        minTapTarget={false}
        accessibilityLabel={`${label}, tap to type`}
        style={{
          flex: 1,
          minHeight: VALUE_BOX_HEIGHT,
          borderRadius: radius.md,
          backgroundColor: pad === field ? surface.tilePressed : surface.tile,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.xs,
        }}
      >
        <Text
          color={value ? color.label : color.tertiaryLabel}
          style={{
            fontSize: VALUE_FONT_SIZE,
            lineHeight: VALUE_LINE_HEIGHT,
            fontFamily: ROUNDED_FACE_BY_WEIGHT['600'],
          }}
        >
          {value || '—'}
        </Text>
        <Text variant="caption" color={color.tertiaryLabel}>
          {suffix}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ gap: space.lg }}>
      {padRow('sets', 'Planned sets', String(sets), 'sets')}

      {!isCardio ? padRow('reps', 'Target reps', reps, 'reps') : null}

      {!isCardio ? padRow('weight', 'Target weight', weight, unit) : null}

      {!isCardio ? (
        <SegmentedField<'kg' | 'lb'>
          label="Unit"
          options={UNIT_OPTIONS}
          value={unit}
          onChange={setUnit}
          variant="inset"
        />
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

      {padRow('rest', 'Rest', rest, 'sec')}

      {/* The bar takes the CTA's place while it is open, as Quick add and the
          session screen both do — "Done" brings the button back. */}
      {pad ? (
        <NumberEntryBar
          label={PADS[pad].label}
          value={entry}
          mode={PADS[pad].mode}
          maxLength={PAD_MAX_LENGTH}
          onChange={applyPad}
          onDone={() => setPad(null)}
        />
      ) : (
        <Button title="Add exercise" onPress={submit} />
      )}
    </View>
  );
}
