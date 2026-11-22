// New / Edit Workout — the template builder. Name + optional duration, then a
// list of exercises picked from the library (each with planned sets/reps/weight
// or a cardio duration). Save writes a TemplateInput. Edit mode (route param
// `id`) prefills from the server and only patches name/duration — the backend has
// no bulk exercise replace on PATCH, so exercise edits on an existing template
// are out of scope here (kept read-only). A failed prefill shows a load-failed
// notice with retry instead of an empty workout.
import { useEffect, useRef, useState } from 'react';
import { Alert, View, type TextInput } from 'react-native';
import type { TFunction } from 'i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LoadFailedNotice } from '@/components/display';
import { showToast } from '@/components/display/toastStore';
import { SwipeableRow } from '@/components/display/SwipeableRow';
import { Button, TextField } from '@/components/forms';
import { ExercisePicker, type PlannedValues } from '@/components/gym';
import { Screen } from '@/components/navigation/Screen';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { color, layout, radius, shadow, space, surface } from '@/lib/design/tokens';
import type { ExerciseLibraryItem, TemplateInput } from '@/lib/types';

type Item = { exercise: ExerciseLibraryItem; planned: PlannedValues };

// "3 × 10 @ 60kg" for strength, "30 min" for cardio. Missing values collapse to
// a dash so a half-filled row still reads.
function summarize(ex: ExerciseLibraryItem, p: PlannedValues, t: TFunction): string {
  if (ex.exercise_type === 'cardio') {
    if (p.duration_minutes != null) return t('gym.loggedMinutes', { minutes: p.duration_minutes });
    return p.sets != null ? t('gymNewTemplate.sets', { count: p.sets }) : t('gymSession.cardio');
  }
  const sets = p.sets ?? '—';
  const reps = p.reps ?? '—';
  return p.weight != null
    ? t('gymSession.plannedSetsWeight', { sets, reps, weight: p.weight, unit: p.weight_unit ?? 'kg' })
    : t('gymSession.plannedSets', { sets, reps });
}

export default function NewTemplateScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = typeof id === 'string' && id.length > 0;

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // Edit mode only: the prefill read, so "no exercises" is never shown for a
  // workout that has not loaded or failed to load.
  const [prefill, setPrefill] = useState<'loading' | 'failed' | 'ready'>(editing ? 'loading' : 'ready');
  const [attempt, setAttempt] = useState(0);
  const durationRef = useRef<TextInput>(null);

  // Edit mode: prefill from the server.
  useEffect(() => {
    if (!id) return;
    let active = true;
    api.gym
      .getTemplate(id)
      .then((template) => {
        if (!active) return;
        setName(template.name);
        setDuration(template.estimated_duration_minutes != null ? String(template.estimated_duration_minutes) : '');
        setItems(
          template.exercises
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
        setPrefill('ready');
      })
      .catch(() => {
        if (active) setPrefill('failed');
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);

  const retryPrefill = () => {
    setPrefill('loading');
    setAttempt((n) => n + 1);
  };

  const canSave = name.trim().length > 0 && (editing || items.length > 0) && prefill === 'ready' && !saving;

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
        track('template_created');
      }
      showToast({ message: editing ? t('gymNewTemplate.updated') : t('gymSession.saved'), tone: 'success' });
      router.back();
    } catch {
      showToast({ message: t('gymNewTemplate.saveFailed'), tone: 'error' });
      setSaving(false);
    }
  };

  return (
    <Screen
      variant="floating"
      showBack
      footer={
        <Button
          title={saving ? t('gymNewTemplate.saving') : t('gymNewTemplate.save')}
          onPress={save}
          disabled={!canSave}
          loading={saving}
        />
      }
    >
      {/* Own title, not Screen's: the design sets it flush, untracked, 4 above the first field. */}
      <Text variant="title1" color={color.label} accessibilityRole="header" style={{ paddingBottom: space.xs }}>
        {editing ? t('gymNewTemplate.editTitle') : t('gymTemplates.newWorkoutLabel')}
      </Text>
      <TextField
        label={t('food.nameField')}
        value={name}
        onChangeText={setName}
        placeholder={t('gymNewTemplate.namePlaceholder')}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => durationRef.current?.focus()}
      />
      <TextField
        // TextField doesn't declare `ref`, but it spreads rest props onto its
        // TextInput and React 19 forwards ref-in-props — so this focuses it.
        {...({ ref: durationRef } as object)}
        label={t('gymNewTemplate.durationLabel')}
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
        placeholder="—"
        returnKeyType="done"
      />

      <View style={{ gap: space.md }}>
        <Text variant="label" color={color.secondaryLabel} style={{ textTransform: 'uppercase', letterSpacing: 1.1 }}>
          {t('gymNewTemplate.exercises')}
        </Text>

        {/* While the prefill runs nothing shows here, so an unloaded workout never reads as empty. */}
        {prefill === 'loading' ? null : prefill === 'failed' ? (
          <LoadFailedNotice message={t('gym.loadFailed')} onRetry={retryPrefill} />
        ) : items.length === 0 ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            {editing ? t('gymNewTemplate.emptyEditing') : t('gymNewTemplate.emptyNew')}
          </Text>
        ) : (
          // One elevated card holds the exercise rows; the clip lives on the inner
          // view because iOS drops a view's own shadow when that view clips.
          <View style={{ backgroundColor: surface.cardElevated, borderRadius: radius.lg, ...shadow.sm }}>
            <View style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
              {items.map((it, i) => {
                const removeAt = () => setItems((prev) => prev.filter((_, idx) => idx !== i));
                const confirmDelete = () =>
                  Alert.alert(t('gym.removeExerciseTitle'), undefined, [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.delete'), style: 'destructive', onPress: removeAt },
                  ]);
                const inner = (
                  <View
                    accessibilityActions={editing ? undefined : [{ name: 'delete', label: t('gymNewTemplate.removeAction') }]}
                    onAccessibilityAction={(e) => {
                      if (e.nativeEvent.actionName === 'delete') confirmDelete();
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.md,
                      // White so a swipe-to-delete reveal stays behind the row.
                      backgroundColor: surface.cardElevated,
                      minHeight: layout.buttonHeight,
                      paddingVertical: space.md,
                      paddingHorizontal: space.lg,
                      borderBottomWidth: i === items.length - 1 ? 0 : layout.hairline,
                      borderBottomColor: surface.divider,
                    }}
                  >
                    <View style={{ flex: 1, gap: space.xs }}>
                      <Text variant="bodyMedium" color={color.label} numberOfLines={1}>
                        {it.exercise.name}
                      </Text>
                      <Text variant="footnote" color={color.secondaryLabel}>
                        {summarize(it.exercise, it.planned, t)}
                      </Text>
                    </View>
                    {!editing ? (
                      <Pressable
                        onPress={confirmDelete}
                        haptic={false}
                        minTapTarget={false}
                        hitSlop={8}
                        accessibilityLabel={t('gymSession.removeExercise', { name: it.exercise.name })}
                      >
                        <Icon name="trash-outline" size={20} color={color.secondaryLabel} />
                      </Pressable>
                    ) : null}
                  </View>
                );
                // Edit mode is name/duration-only, so exercise rows are read-only there.
                return editing ? (
                  <View key={`${it.exercise.id}-${i}`}>{inner}</View>
                ) : (
                  <SwipeableRow
                    key={`${it.exercise.id}-${i}`}
                    confirmTitle={t('gym.removeExerciseTitle')}
                    onDelete={removeAt}
                  >
                    {inner}
                  </SwipeableRow>
                );
              })}
            </View>
          </View>
        )}

        {editing && items.length > 0 ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            {t('gymNewTemplate.readOnly')}
          </Text>
        ) : null}

        {!editing ? (
          <Button
            title={t('gymSession.addExercise')}
            variant="tertiary"
            icon="add"
            onPress={() => setPickerOpen(true)}
            style={{ backgroundColor: surface.tile }}
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
