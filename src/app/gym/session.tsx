// Gym check-in / logging screen. Reads today's template (useToday) and lets the
// user tick each planned exercise off, log actual sets (strength) or duration
// (cardio), and add extra exercises via the ExercisePicker. Finishing best-effort
// creates a session, logs the exercises, and marks the day complete — every step
// wrapped so a backend failure still leaves the screen with a toast.
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation, type Href } from 'expo-router';

import { ExercisePicker, ParameterForm, type PlannedValues } from '@/components/gym';
import { NumberEntryBar, type NumberEntryMode } from '@/components/common/NumberEntryBar';
import { Card, EmptyState, Skeleton, showToast } from '@/components/display';
import { Button, SliderField } from '@/components/forms';
import { Screen } from '@/components/navigation/Screen';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import type { ExerciseLibraryItem, GymExerciseInput, LoggedParameters, ParameterSchema } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useToday } from '@/lib/data/gymSchedule';
import { color, radius, ROUNDED_FACE_BY_WEIGHT, space, surface } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';
import { logGymSession } from '@/lib/data';

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

// Where the "How did it go?" chooser lands. Each value opens the view that
// already exists for that answer; anything else (or nothing) is the plain
// check-in the screen has always opened with.
const SESSION_MODES = ['adjust', 'ticklist', 'picker'] as const;
type SessionMode = (typeof SESSION_MODES)[number];

const isSessionMode = (v: string | undefined): v is SessionMode =>
  v !== undefined && (SESSION_MODES as readonly string[]).includes(v);

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

/** "Set 1" gutter — every value box lines up on one edge (design §3.2). */
const SET_LABEL_WIDTH = 46;

/** The design's value box: 40pt tall with a 16/20 rounded figure. No token
 *  covers either, and 40 is deliberately below the 44pt tap target because the
 *  box sits inside a 44pt row. */
const VALUE_BOX_HEIGHT = 40;
const VALUE_FONT_SIZE = 16;
const VALUE_LINE_HEIGHT = 20;

/** The numbers this screen types into, with the design's pad captions, keyboards
 *  and in-box unit suffixes. The design caps every one of them at five digits. */
type PadField = 'weight' | 'reps' | 'duration' | 'distance';
const PADS: Record<PadField, { label: string; mode: NumberEntryMode; unit: string }> = {
  weight: { label: 'Weight · kg', mode: 'decimal', unit: 'kg' },
  reps: { label: 'Reps', mode: 'numeric', unit: 'reps' },
  duration: { label: 'Minutes', mode: 'numeric', unit: 'min' },
  // The design logs cardio as speed segments and has no distance pad; this app
  // stores a distance, so the caption names what it actually saves.
  distance: { label: 'Distance · km', mode: 'decimal', unit: 'km' },
};
const PAD_MAX_LENGTH = 5;

/** Which value the bar is docked under: the design keys it by field, row and set
 *  index the same way ("kg:3:1"). */
type PadTarget = { field: PadField; rowKey: string; index: number };
const samePad = (a: PadTarget | null, b: PadTarget) =>
  a != null && a.field === b.field && a.rowKey === b.rowKey && a.index === b.index;

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

// What an untouched PLANNED row starts as. The chooser's two plan-shaped
// answers change it rather than seeding state up front: 'ticklist' ("Only some
// of it") starts everything ticked, to untick what was skipped, and 'adjust'
// ("Different weights") additionally opens each row's numbers. Extras are never
// affected — the picker already writes their state when they are added.
function initialStateFor(row: Row, mode: SessionMode | undefined): RowState {
  if (row.isExtra) return EMPTY_STATE;
  if (mode === 'adjust') return { ...seededState(row), expanded: true };
  if (mode === 'ticklist') return seededState(row);
  return EMPTY_STATE;
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
      return { name: row.name, parameters: st.params, rest_seconds: row.planned.rest_seconds };
    }
    const parts: string[] = [];
    const dur = toNum(st.duration);
    const dist = toNum(st.distance);
    if (dur != null) parts.push(`${dur} min`);
    if (dist != null) parts.push(`${dist} km`);
    return { name: row.name, rest_seconds: row.planned.rest_seconds, notes: parts.length > 0 ? parts.join(' · ') : undefined };
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
    rest_seconds: row.planned.rest_seconds,
    rpe: st.rpe != null && st.rpe >= 1 ? st.rpe : undefined, // 0 = "not set"
  };
}

export default function GymSessionScreen(): JSX.Element {
  const { today, loading } = useToday();
  const navigation = useNavigation();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const mode = isSessionMode(modeParam) ? modeParam : undefined;

  const [states, setStates] = useState<Record<string, RowState>>({});
  const [extras, setExtras] = useState<Row[]>([]);
  // 'picker' is "Something else" — the library opens over the check-in.
  const [pickerVisible, setPickerVisible] = useState(mode === 'picker');
  const [saving, setSaving] = useState(false);
  // Which value the docked bar is editing, and its raw entry string. One at a
  // time, as the design does.
  const [pad, setPad] = useState<PadTarget | null>(null);
  const [entry, setEntry] = useState('');
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
          rest_seconds: te.rest_seconds ?? undefined,
        },
        isExtra: false,
        exerciseId: te.exercise?.id,
        schema: te.exercise?.parameter_schema ?? null,
      })),
    [today],
  );

  const rows = useMemo(() => [...plannedRows, ...extras], [plannedRows, extras]);
  const hasExercises = rows.length > 0;
  // Every read goes through this, so an untouched row looks the same to the
  // rows, to `dirty` and to the completion rate.
  const stateOf = (row: Row) => states[row.key] ?? initialStateFor(row, mode);
  const dirty = rows.some((r) => stateOf(r).checked);

  const toggleCheck = (row: Row) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? initialStateFor(row, mode);
      return { ...prev, [row.key]: { ...cur, checked: !cur.checked } };
    });

  const onLogPress = (row: Row) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? initialStateFor(row, mode);
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
      const cur = prev[row.key] ?? initialStateFor(row, mode);
      const sets = cur.sets.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
      return { ...prev, [row.key]: { ...cur, sets, checked: true } };
    });

  const addSet = (row: Row) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? initialStateFor(row, mode);
      const last = cur.sets[cur.sets.length - 1] ?? {
        reps: row.planned.reps != null ? String(row.planned.reps) : '',
        weight: row.planned.weight != null ? String(row.planned.weight) : '',
      };
      return { ...prev, [row.key]: { ...cur, sets: [...cur.sets, { ...last }], checked: true } };
    });

  const updateCardio = (row: Row, field: 'duration' | 'distance', value: string) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? initialStateFor(row, mode);
      return { ...prev, [row.key]: { ...cur, [field]: value, checked: true } };
    });

  const setParams = (row: Row, params: LoggedParameters) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? initialStateFor(row, mode);
      return { ...prev, [row.key]: { ...cur, params, checked: true } };
    });

  const setRpe = (row: Row, rpe: number) =>
    setStates((prev) => {
      const cur = prev[row.key] ?? initialStateFor(row, mode);
      return { ...prev, [row.key]: { ...cur, rpe } };
    });

  // Tapping the open value closes the bar, any other value switches it, and the
  // entry string always restarts empty.
  const startEdit = (target: PadTarget) => () => {
    setEntry('');
    setPad((open) => (samePad(open, target) ? null : target));
  };

  // The bar writes the sanitised STRING into the same state the boxed fields
  // used to fill, so an emptied value stays unset rather than becoming a 0.
  const applyPad = (text: string) => {
    setEntry(text);
    if (!pad) return;
    const row = rows.find((r) => r.key === pad.rowKey);
    if (!row) return;
    if (pad.field === 'reps' || pad.field === 'weight') updateSet(row, pad.index, pad.field, text);
    else updateCardio(row, pad.field, text);
  };

  // The design's value box: the number and its unit on a tile that lights up
  // while its pad is open. Tapping it again closes the pad.
  const valueBox = (target: PadTarget, value: string, accessibilityLabel: string) => (
    <Pressable
      onPress={startEdit(target)}
      minTapTarget={false}
      accessibilityLabel={accessibilityLabel}
      style={{
        flex: 1,
        minHeight: VALUE_BOX_HEIGHT,
        borderRadius: radius.md,
        backgroundColor: samePad(pad, target) ? surface.tilePressed : surface.tile,
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
        {PADS[target.field].unit}
      </Text>
    </Pressable>
  );

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
        .map((r) => inputFor(r, states[r.key] ?? initialStateFor(r, mode)))
        .filter((x): x is GymExerciseInput => x !== null);
      const doneCount = plannedRows.filter((r) => (states[r.key] ?? initialStateFor(r, mode)).checked).length;
      const rate = plannedRows.length > 0 ? doneCount / plannedRows.length : undefined;

      // create → N exercises → complete goes through the offline queue as ONE
      // ordered unit sharing an idempotency key: offline it replays in order on
      // reconnect, a replay can never create a second session, and a partial
      // flush can't leave exercises orphaned from their session.
      logGymSession(
        { durationMin: today?.template?.estimated_duration_minutes ?? undefined },
        { name: today?.template?.name ?? undefined, exercises: inputs, completionRate: rate },
      );
      haptics.success();
      showToast({ message: successMessage, tone: 'success' });

      if (router.canGoBack()) router.back();
      else {
        leavingRef.current = false;
        setSaving(false);
      }
    },
    [plannedRows, extras, states, today, mode],
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
    const st = stateOf(row);
    return (
      <Card key={row.key} variant="elevated">
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
              color={st.checked ? color.primary : color.light3}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  {valueBox({ field: 'duration', rowKey: row.key, index: 0 }, st.duration, `${row.name} duration in minutes`)}
                  {valueBox(
                    { field: 'distance', rowKey: row.key, index: 0 },
                    st.distance,
                    `${row.name} distance in kilometres, optional`,
                  )}
                </View>
              )
            ) : (
              <>
                {st.sets.map((s, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    {/* The design labels each set row in the muted footnote and
                        keeps every value box on one left edge. */}
                    <Text variant="footnote" color={color.secondaryLabel} style={{ minWidth: SET_LABEL_WIDTH }}>
                      {`Set ${idx + 1}`}
                    </Text>
                    {valueBox({ field: 'reps', rowKey: row.key, index: idx }, s.reps, `Set ${idx + 1} reps`)}
                    {valueBox({ field: 'weight', rowKey: row.key, index: idx }, s.weight, `Set ${idx + 1} weight`)}
                  </View>
                ))}
                <Button
                  title="Add set"
                  variant="tertiary"
                  fullWidth={false}
                  icon="add"
                  onPress={() => addSet(row)}
                  style={{ alignSelf: 'flex-start', backgroundColor: surface.tile }}
                />
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Screen
        variant="floating"
        eyebrow="Today"
        title={today?.template?.name ?? 'Workout'}
        showBack
        footer={
          hasExercises && !pad ? (
            <Button
              title="Finish workout"
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
            actionLabel="Add an exercise"
            onAction={() => setPickerVisible(true)}
          />
        ) : (
          <View style={{ gap: space.md }}>
            <Text variant="footnote" color={color.secondaryLabel}>
              Tick each exercise as you complete it
            </Text>
            {rows.map(renderRow)}
            {/* The design's secondary action is a filled grey pill, not an
                outlined one — Button keeps its variants, the fill comes from the
                call site so no other screen's buttons change. */}
            <Button
              title="Add an extra exercise"
              variant="tertiary"
              icon="add"
              onPress={() => setPickerVisible(true)}
              style={{ backgroundColor: surface.tile }}
            />
          </View>
        )}

        <ExercisePicker
          visible={pickerVisible}
          onClose={() => {
            setPickerVisible(false);
            // Opened to add something, and nothing was: the design clears the sheet and leaves you on the Gym day.
            if (extras.length === 0 && (mode === 'picker' || !hasExercises)) router.replace('/(tabs)/gym');
          }}
          onPick={onPickExtra}
        />
      </Screen>

      {pad ? (
        <NumberEntryBar
          label={PADS[pad.field].label}
          value={entry}
          mode={PADS[pad.field].mode}
          maxLength={PAD_MAX_LENGTH}
          onChange={applyPad}
          onDone={() => setPad(null)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
