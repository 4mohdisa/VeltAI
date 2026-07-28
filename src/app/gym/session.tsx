// Gym check-in / logging screen. Reads today's template (useToday) and lets the
// user tick each planned exercise off, log actual sets (strength) or duration
// (cardio), and add extra exercises via the ExercisePicker. Finishing best-effort
// creates a session, logs the exercises, and marks the day complete — every step
// wrapped so a backend failure still leaves the screen with a toast.
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useNavigation, type Href } from 'expo-router';

import { ExercisePicker, ParameterForm, type PlannedValues } from '@/components/gym';
import { Card, EmptyState, Skeleton, showToast } from '@/components/display';
import { Button, SliderField, TextField } from '@/components/forms';
import { Screen } from '@/components/navigation/Screen';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { api, type ExerciseLibraryItem, type GymExerciseInput, type LoggedParameters, type ParameterSchema } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useToday } from '@/lib/data/gymSchedule';
import { todayISO } from '@/lib/data/mappers';
import { color, radius, space } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';

// One row in the checklist — a planned template exercise or a user-added extra.
type Row = {
  key: string;
  name: string;
  isCardio: boolean;
  planned: PlannedValues;
  isExtra: boolean;
  exerciseId?: string; // library id, for the parameter form preview/last-logged
  schema?: ParameterSchema | null; // cardio parameter schema, when present
};

type SetEntry = { reps: string; weight: string };
type RowState = {
  checked: boolean;
  expanded: boolean; // inline log form open
  sets: SetEntry[]; // strength
  duration: string; // cardio (no-schema fallback)
  distance: string; // cardio (no-schema fallback)
  params: LoggedParameters; // cardio with a schema
  rpe?: number; // strength RPE (1-10)
};

// Shared empty state — always spread, never mutated.
const EMPTY_STATE: RowState = { checked: false, expanded: false, sets: [], duration: '', distance: '', params: {} };

// Blank / non-numeric → undefined (field unset), matching PlannedValuesForm.
function toNum(s: string): number | undefined {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

// Prefill the log form with one row per planned set, seeded with planned reps/weight.
function seedSets(p: PlannedValues): SetEntry[] {
  const count = Math.min(Math.max(p.sets ?? 3, 1), 12);
  const reps = p.reps != null ? String(p.reps) : '';
  const weight = p.weight != null ? String(p.weight) : '';
  return Array.from({ length: count }, () => ({ reps, weight }));
}

// Extras arrive already-logged (the user just set their planned values in the picker).
function seededState(row: Row): RowState {
  if (row.isCardio) {
    return {
      ...EMPTY_STATE,
      checked: true,
      duration: row.planned.duration_minutes != null ? String(row.planned.duration_minutes) : '',
    };
  }
  return { ...EMPTY_STATE, checked: true, sets: seedSets(row.planned) };
}

function summaryOf(row: Row): string {
  const p = row.planned;
  if (row.isCardio) return p.duration_minutes != null ? `${p.duration_minutes} min` : 'Cardio';
  const base = `${p.sets ?? '?'} × ${p.reps ?? '?'}`;
  return p.weight != null ? `${base} @ ${p.weight}${p.weight_unit ?? 'kg'}` : base;
}

// Collapse a row's state into the single GymExercise the API stores (one row per
// exercise): the top set by weight drives weight/reps; sets = how many logged.
function inputFor(row: Row, st: RowState | undefined): GymExerciseInput | null {
  if (!st || !st.checked) return null;
  if (row.isCardio) {
    // Schema-driven cardio → send the captured parameters (the backend computes
    // calories). No schema → fall back to the free-text duration/distance note.
    if (row.schema && Object.keys(st.params).length > 0) {
      return { name: row.name, parameters: st.params };
    }
    const parts: string[] = [];
    const dur = toNum(st.duration);
    const dist = toNum(st.distance);
    if (dur != null) parts.push(`${dur} min`);
    if (dist != null) parts.push(`${dist} km`);
    return { name: row.name, notes: parts.length > 0 ? parts.join(' · ') : undefined };
  }
  let top: { reps?: number; weight: number } | null = null;
  let firstReps: number | undefined;
  for (let i = 0; i < st.sets.length; i++) {
    const reps = toNum(st.sets[i].reps);
    const weight = toNum(st.sets[i].weight);
    if (i === 0) firstReps = reps;
    if (weight != null && (top === null || weight > top.weight)) top = { reps, weight };
  }
  return {
    name: row.name,
    sets: st.sets.length > 0 ? st.sets.length : undefined,
    reps: top?.reps ?? firstReps,
    weight: top?.weight,
    weight_unit: top !== null ? row.planned.weight_unit ?? 'kg' : undefined,
    rpe: st.rpe != null && st.rpe >= 1 ? st.rpe : undefined, // 0 = "not set"
  };
}

export default function GymSessionScreen(): JSX.Element {
  const { today, loading } = useToday();
  const navigation = useNavigation();

  const [states, setStates] = useState<Record<string, RowState>>({});
  const [extras, setExtras] = useState<Row[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const extraSeq = useRef(0);
  const leavingRef = useRef(false); // true once we intentionally navigate away (skip the guard)

  const plannedRows = useMemo<Row[]>(
    () =>
      (today?.exercises ?? []).map((te) => ({
        key: te.id,
        name: te.exercise?.name ?? 'Exercise',
        isCardio: te.exercise?.exercise_type === 'cardio',
        planned: {
          sets: te.planned_sets ?? undefined,
          reps: te.planned_reps ?? undefined,
          weight: te.planned_weight ?? undefined,
          weight_unit: te.planned_weight_unit ?? undefined,
          duration_minutes: te.planned_duration_minutes ?? undefined,
        },
        isExtra: false,
        exerciseId: te.exercise?.id,
        schema: te.exercise?.parameter_schema ?? null,
      })),
    [today],
  );

  const rows = useMemo(() => [...plannedRows, ...extras], [plannedRows, extras]);
  const hasExercises = rows.length > 0;
  const dirty = rows.some((r) => states[r.key]?.checked);

  const toggleCheck = (row: Row) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? EMPTY_STATE;
      return { ...prev, [row.key]: { ...cur, checked: !cur.checked } };
    });

  const onLogPress = (row: Row) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? EMPTY_STATE;
      if (cur.expanded) return { ...prev, [row.key]: { ...cur, expanded: false } };
      if (row.isCardio) {
        return {
          ...prev,
          [row.key]: {
            ...cur,
            expanded: true,
            checked: true,
            duration:
              cur.duration || (row.planned.duration_minutes != null ? String(row.planned.duration_minutes) : ''),
          },
        };
      }
      const sets = cur.sets.length > 0 ? cur.sets : seedSets(row.planned);
      return { ...prev, [row.key]: { ...cur, expanded: true, checked: true, sets } };
    });

  const updateSet = (row: Row, idx: number, field: keyof SetEntry, value: string) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? EMPTY_STATE;
      const sets = cur.sets.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
      return { ...prev, [row.key]: { ...cur, sets, checked: true } };
    });

  const addSet = (row: Row) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? EMPTY_STATE;
      const last = cur.sets[cur.sets.length - 1] ?? {
        reps: row.planned.reps != null ? String(row.planned.reps) : '',
        weight: row.planned.weight != null ? String(row.planned.weight) : '',
      };
      return { ...prev, [row.key]: { ...cur, sets: [...cur.sets, { ...last }], checked: true } };
    });

  const updateCardio = (row: Row, field: 'duration' | 'distance', value: string) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? EMPTY_STATE;
      return { ...prev, [row.key]: { ...cur, [field]: value, checked: true } };
    });

  const setParams = (row: Row, params: LoggedParameters) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? EMPTY_STATE;
      return { ...prev, [row.key]: { ...cur, params, checked: true } };
    });

  const setRpe = (row: Row, rpe: number) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? EMPTY_STATE;
      return { ...prev, [row.key]: { ...cur, rpe } };
    });

  const onPickExtra = (exercise: ExerciseLibraryItem, planned: PlannedValues) => {
    const key = `extra_${extraSeq.current++}`;
    const row: Row = {
      key,
      name: exercise.name,
      isCardio: exercise.exercise_type === 'cardio',
      planned,
      isExtra: true,
      exerciseId: exercise.id,
      schema: exercise.parameter_schema ?? null,
    };
    setExtras((e) => [...e, row]);
    setStates((prev) => ({ ...prev, [key]: seededState(row) }));
    setPickerVisible(false);
  };

  const finishWorkout = useCallback(
    async (successMessage: string) => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setSaving(true);
      track('workout_logged');

      const all = [...plannedRows, ...extras];
      const inputs = all
        .map((r) => inputFor(r, states[r.key]))
        .filter((x): x is GymExerciseInput => x !== null);
      const doneCount = plannedRows.filter((r) => states[r.key]?.checked).length;
      const rate = plannedRows.length > 0 ? doneCount / plannedRows.length : undefined;

      try {
        const session = await api.gym.createSession({
          date: todayISO(),
          name: today?.template?.name ?? undefined,
          duration_minutes: today?.template?.estimated_duration_minutes ?? undefined,
        });
        for (const input of inputs) {
          try {
            await api.gym.addExercise(session.id, input);
          } catch {
            // best-effort — a single failed exercise never blocks the session
          }
        }
        try {
          await api.gym.completeSession(session.id, rate);
        } catch {
          // best-effort — completion is a bonus signal, not required to save
        }
        haptics.success();
        showToast({ message: successMessage, tone: 'success' });
      } catch {
        // Backend down / offline — the capture already lived in local state.
        showToast({ message: 'Saved locally', tone: 'info' });
      }

      if (router.canGoBack()) router.back();
      else {
        leavingRef.current = false;
        setSaving(false);
      }
    },
    [plannedRows, extras, states, today],
  );

  // Intercept every back path (header tap, swipe, hardware back) once something is
  // logged, so an accidental exit offers to save. addListener (not setState) keeps
  // this effect side-effect-free per the set-state-in-effect rule.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (leavingRef.current || !dirty) return;
      e.preventDefault();
      Alert.alert('Save progress?', 'You have logged exercises that haven’t been saved.', [
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            leavingRef.current = true;
            navigation.dispatch(e.data.action);
          },
        },
        { text: 'Save', onPress: () => void finishWorkout('Progress saved') },
        // Abort and resume the workout — without this the user is forced to either
        // discard or exit-with-save (AUDIT_REPORT.md M2).
        { text: 'Keep editing', style: 'cancel' },
      ]);
    });
    return unsub;
  }, [navigation, dirty, finishWorkout]);

  const renderRow = (row: Row) => {
    const st = states[row.key] ?? EMPTY_STATE;
    return (
      <Card key={row.key}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Pressable
            onPress={() => toggleCheck(row)}
            haptic={false}
            minTapTarget={false}
            hitSlop={10}
            accessibilityLabel={`${row.name}, ${st.checked ? 'done' : 'not done'}`}
            accessibilityState={{ checked: st.checked }}
            accessibilityRole="checkbox"
          >
            <Icon
              name={st.checked ? 'checkmark-circle' : 'ellipse'}
              size={26}
              color={st.checked ? color.black : color.gray400}
            />
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(`/gym/exercise-progress?name=${encodeURIComponent(row.name)}` as Href)
            }
            haptic={false}
            minTapTarget={false}
            accessibilityLabel={`${row.name}, view progress`}
            style={{ flex: 1, gap: space.xs }}
          >
            <Text variant="bodyMedium" color={color.label} numberOfLines={1}>
              {row.name}
              {row.isExtra ? '  (added)' : ''}
            </Text>
            <Text variant="footnote" color={color.secondaryLabel}>
              {summaryOf(row)}
            </Text>
          </Pressable>

          <Button
            title={st.expanded ? 'Hide' : 'Log'}
            variant="secondary"
            fullWidth={false}
            onPress={() => onLogPress(row)}
          />
        </View>

        {st.expanded ? (
          <View style={{ gap: space.md, marginTop: space.lg }}>
            {row.isCardio ? (
              row.schema && row.exerciseId ? (
                <ParameterForm
                  exerciseId={row.exerciseId}
                  schema={row.schema}
                  planned={
                    row.planned.duration_minutes != null ? { duration_minutes: row.planned.duration_minutes } : undefined
                  }
                  onParamsChange={(p) => setParams(row, p)}
                />
              ) : (
                <>
                  <TextField
                    label="Duration (min)"
                    value={st.duration}
                    onChangeText={(v) => updateCardio(row, 'duration', v)}
                    keyboardType="number-pad"
                    placeholder="30"
                  />
                  <TextField
                    label="Distance (km, optional)"
                    value={st.distance}
                    onChangeText={(v) => updateCardio(row, 'distance', v)}
                    keyboardType="decimal-pad"
                    placeholder="—"
                  />
                </>
              )
            ) : (
              <>
                {st.sets.map((s, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Text variant="label" color={color.secondaryLabel} style={{ minWidth: 44 }}>
                      {`Set ${idx + 1}`}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <TextField
                        value={s.reps}
                        onChangeText={(v) => updateSet(row, idx, 'reps', v)}
                        keyboardType="number-pad"
                        placeholder="Reps"
                        accessibilityLabel={`Set ${idx + 1} reps`}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextField
                        value={s.weight}
                        onChangeText={(v) => updateSet(row, idx, 'weight', v)}
                        keyboardType="decimal-pad"
                        placeholder="kg"
                        accessibilityLabel={`Set ${idx + 1} weight`}
                      />
                    </View>
                  </View>
                ))}
                <Button title="Add set" variant="tertiary" fullWidth={false} icon="add" onPress={() => addSet(row)} />
                {/* Optional RPE (0 = not set), feeds progression not calories. */}
                <SliderField
                  label="RPE — effort (optional)"
                  value={st.rpe ?? 0}
                  min={0}
                  max={10}
                  step={1}
                  onValueChange={(n) => setRpe(row, n)}
                  formatValue={(n) => (n === 0 ? 'Not set' : `${n} / 10`)}
                />
              </>
            )}
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <Screen
      title={today?.template?.name ?? 'Workout'}
      showBack
      footer={
        hasExercises ? (
          <Button
            title="Finish Workout"
            onPress={() => void finishWorkout('Workout saved')}
            loading={saving}
            disabled={saving}
          />
        ) : undefined
      }
    >
      {loading ? (
        <View style={{ gap: space.lg }}>
          <Skeleton width="100%" height={72} rounded={radius.lg} />
          <Skeleton width="100%" height={72} rounded={radius.lg} />
          <Skeleton width="100%" height={72} rounded={radius.lg} />
        </View>
      ) : !hasExercises ? (
        <EmptyState
          icon="barbell"
          title={today?.is_rest_day ? 'Rest day' : 'Nothing scheduled'}
          message="Add an exercise to log a freestyle session."
          actionLabel="Add exercise"
          onAction={() => setPickerVisible(true)}
        />
      ) : (
        <View style={{ gap: space.lg }}>
          <Text variant="callout" color={color.secondaryLabel}>
            Tick each exercise as you complete it
          </Text>
          {rows.map(renderRow)}
          <Button
            title="Add extra exercise"
            variant="tertiary"
            icon="add-circle"
            onPress={() => setPickerVisible(true)}
          />
        </View>
      )}

      <ExercisePicker visible={pickerVisible} onClose={() => setPickerVisible(false)} onPick={onPickExtra} />
    </Screen>
  );
}
