// New / Edit Workout — the template builder. Name + optional duration, then a
// list of exercises picked from the library (each with planned sets/reps/weight
// or a cardio duration). Save writes a TemplateInput. Edit mode (route param
// `id`) prefills from the server and only patches name/duration — the backend has
// no bulk exercise replace on PATCH, so exercise edits on an existing template
// are out of scope here (kept read-only). All API calls are best-effort.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { showToast } from '@/components/display/toastStore';
import { SwipeableRow } from '@/components/display/SwipeableRow';
import { Button, TextField } from '@/components/forms';
import { ExercisePicker, type PlannedValues } from '@/components/gym';
import { Screen } from '@/components/navigation/Screen';
import { Text } from '@/components/primitives/Text';
import { api } from '@/lib/api';
import { color, space, surface } from '@/lib/design/tokens';
import type { ExerciseLibraryItem, TemplateInput } from '@/lib/types';

type Item = { exercise: ExerciseLibraryItem; planned: PlannedValues };

// "3 × 10 @ 60kg" for strength, "30 min" for cardio. Missing values collapse to
// a dash so a half-filled row still reads.
function summarize(ex: ExerciseLibraryItem, p: PlannedValues): string {
  if (ex.exercise_type === 'cardio') {
    if (p.duration_minutes != null) return `${p.duration_minutes} min`;
    return p.sets != null ? `${p.sets} sets` : 'Cardio';
  }
  const setsReps = `${p.sets ?? '—'} × ${p.reps ?? '—'}`;
  const weight = p.weight != null ? ` @ ${p.weight}${p.weight_unit ?? 'kg'}` : '';
  return setsReps + weight;
}

export default function NewTemplateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = typeof id === 'string' && id.length > 0;

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode: prefill from the server. Degrades to a blank form on any failure.
  useEffect(() => {
    if (!id) return;
    let active = true;
    api.gym
      .getTemplate(id)
      .then((t) => {
        if (!active) return;
        setName(t.name);
        setDuration(t.estimated_duration_minutes != null ? String(t.estimated_duration_minutes) : '');
        setItems(
          t.exercises
            .filter((te): te is typeof te & { exercise: ExerciseLibraryItem } => !!te.exercise)
            .map((te) => ({
              exercise: te.exercise,
              planned: {
                sets: te.planned_sets ?? undefined,
                reps: te.planned_reps ?? undefined,
                weight: te.planned_weight ?? undefined,
                weight_unit: te.planned_weight_unit ?? undefined,
                duration_minutes: te.planned_duration_minutes ?? undefined,
                rest_seconds: te.rest_seconds ?? undefined,
              },
            })),
        );
      })
      .catch(() => {
        /* degrade: leave the form blank */
      });
    return () => {
      active = false;
    };
  }, [id]);

  const canSave = name.trim().length > 0 && (editing || items.length > 0) && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const durNum = parseInt(duration, 10);
    const est = Number.isFinite(durNum) && durNum > 0 ? durNum : undefined;
    try {
      if (editing && id) {
        await api.gym.updateTemplate(id, { name: name.trim(), estimated_duration_minutes: est });
      } else {
        const input: TemplateInput = {
          name: name.trim(),
          estimated_duration_minutes: est,
          exercises: items.map((it, i) => ({
            exercise_id: it.exercise.id,
            planned_sets: it.planned.sets,
            planned_reps: it.planned.reps,
            planned_weight: it.planned.weight,
            planned_weight_unit: it.planned.weight_unit,
            planned_duration_minutes: it.planned.duration_minutes,
            rest_seconds: it.planned.rest_seconds,
            sort_order: i,
          })),
        };
        await api.gym.createTemplate(input);
      }
      showToast({ message: editing ? 'Workout updated' : 'Workout saved', tone: 'success' });
      router.back();
    } catch {
      showToast({ message: 'Could not save workout', tone: 'error' });
      setSaving(false);
    }
  };

  return (
    <Screen
      title={editing ? 'Edit Workout' : 'New Workout'}
      showBack
      footer={
        <Button
          title={saving ? 'Saving…' : 'Save Workout'}
          onPress={save}
          disabled={!canSave}
          loading={saving}
        />
      }
    >
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Push Day" />
      <TextField
        label="Duration (min, optional)"
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
        placeholder="—"
      />

      <View style={{ gap: space.md }}>
        <Text variant="label" color={color.secondaryLabel}>
          EXERCISES
        </Text>

        {items.length === 0 ? (
          <Text variant="footnote" color={color.tertiaryLabel}>
            {editing ? 'No exercises on this workout.' : 'Add exercises to build your workout.'}
          </Text>
        ) : (
          items.map((it, i) => {
            const inner = (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  backgroundColor: color.white,
                  paddingVertical: space.md,
                  paddingHorizontal: space.xs,
                  borderBottomWidth: 1,
                  borderBottomColor: surface.divider,
                }}
              >
                <View style={{ flex: 1, gap: space.xs }}>
                  <Text variant="bodyMedium" color={color.label} numberOfLines={1}>
                    {it.exercise.name}
                  </Text>
                  <Text variant="footnote" color={color.secondaryLabel}>
                    {summarize(it.exercise, it.planned)}
                  </Text>
                </View>
              </View>
            );
            // Edit mode is name/duration-only, so exercise rows are read-only there.
            return editing ? (
              <View key={`${it.exercise.id}-${i}`}>{inner}</View>
            ) : (
              <SwipeableRow
                key={`${it.exercise.id}-${i}`}
                confirmTitle="Remove exercise?"
                onDelete={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
              >
                {inner}
              </SwipeableRow>
            );
          })
        )}

        {!editing ? (
          <Button
            title="Add Exercise"
            variant="secondary"
            icon="add"
            onPress={() => setPickerOpen(true)}
          />
        ) : null}
      </View>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(exercise, planned) => {
          setItems((prev) => [...prev, { exercise, planned }]);
          setPickerOpen(false);
        }}
      />
    </Screen>
  );
}
