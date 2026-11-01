// Per-exercise progress screen. Reads the `name` route param and shows the
// design's exercise detail: the muscles worked, the form guide, and the History
// card (a bar per session of volume or reps, and the latest and best stats). The
// History card degrades to an empty state when there aren't enough logs, for
// cardio (the progress read carries no minutes), or when the read returns null.
import type { JSX } from 'react';
import { PixelRatio, View, type TextStyle } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Card, CardHeaderRow, EmptyState, Skeleton } from '@/components/display';
import { Screen } from '@/components/navigation/Screen';
import { Text } from '@/components/primitives/Text';
import { useExerciseProgress, useExercises } from '@/lib/data/gymSchedule';
import { categoryAccent, color, layout, radius, ROUNDED_FACE_BY_WEIGHT, space, surface } from '@/lib/design/tokens';
import { formatNumber } from '@/lib/formatting';
import type { ExerciseLibraryItem } from '@/lib/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const HISTORY_SESSIONS = 8;
const CHART_HEIGHT = 118;
/** The design's chart and card metrics. No token covers any of them. */
const BAR_GAP = 6;
const BAR_RADIUS = 6;
const MIN_BAR_PERCENT = 7;
const METRIC_LINE_OFFSET = -5;
const TITLE_GAP = 3;
const STAT_GAP = 1;
const CHIP_HEIGHT = 28;
const CHIP_PADDING = 10;
const CHIP_GAP = 5;
const CHIP_ROW_GAP = 6;
const STEP_DISC = 22;
const STEP_GAP = 10;
/** The design's streak washes on white, as hex alpha: 22% primary, 10% secondary. */
const PRIMARY_WASH = `${categoryAccent.streak}38`;
const SECONDARY_WASH = `${categoryAccent.streak}1A`;

// The design's small type has no exact token. Read at render, and the line height
// scales with the text size as textStyle() does, so large sizes don't clip.
const scaled = (fontSize: number, fontWeight: TextStyle['fontWeight'], lineHeight: number): TextStyle => ({
  fontSize,
  fontWeight,
  lineHeight: lineHeight * PixelRatio.getFontScale(),
});

// The design's form guide, chosen from the exercise's name.
const GUIDE = {
  press: ['Set your feet, grip just outside shoulder width and brace your core.', 'Lower under control until the bar or handles reach chest level, elbows at about 45°.', 'Press back up and stop just short of locking out, keeping shoulders down.'],
  squat: ['Bar high on the back, feet shoulder width, toes turned out slightly.', 'Sit down between your hips until thighs pass parallel, knees tracking over toes.', 'Drive through mid-foot and stand tall without letting the chest drop.'],
  hinge: ['Hips back, chest proud, bar close to the shins with a neutral spine.', 'Push the hips back until you feel the hamstrings load, bar grazing the legs.', 'Squeeze the glutes to stand up — the bar path stays vertical.'],
  row: ['Set a stable torso angle and pull the shoulder blades down first.', 'Row to the lower ribs, elbows past the body, no shrugging.', 'Lower under control for a full stretch before the next rep.'],
  curl: ['Elbows pinned to the ribs, wrists neutral, shoulders relaxed.', 'Curl until the forearm passes vertical without swinging the torso.', 'Lower slowly for three counts — the negative is the work.'],
  raise: ['Slight forward lean, elbows soft, weights beside the thighs.', 'Lift out to shoulder height leading with the elbows, not the hands.', 'Pause a beat at the top, then lower under tension.'],
  push: ['Stand a step back from the stack, elbows tight to your sides.', 'Extend to full lockout, pausing briefly with the triceps contracted.', 'Return only until the forearms reach parallel to keep tension.'],
  cardio: ['Warm up for three to five minutes at an easy pace.', 'Hold each interval at its target speed — breathing hard but able to speak a word.', 'Finish with two minutes of walking to bring the heart rate down.'],
  other: ['Set up so the working muscle is the only thing moving.', 'Move through the full range you can control, no bouncing.', 'Match last session’s numbers before adding weight.'],
};

function guideFor(name: string): string[] {
  const s = name.toLowerCase();
  if (/squat|leg press/.test(s)) return GUIDE.squat;
  if (/deadlift|romanian|hip thrust/.test(s)) return GUIDE.hinge;
  if (/row|pulldown|pull-up|pullup/.test(s)) return GUIDE.row;
  if (/curl/.test(s)) return GUIDE.curl;
  if (/raise/.test(s)) return GUIDE.raise;
  if (/pushdown|dip|extension/.test(s)) return GUIDE.push;
  if (/press|fly/.test(s)) return GUIDE.press;
  if (/treadmill|bike|rowing machine|elliptical/.test(s)) return GUIDE.cardio;
  return GUIDE.other;
}

const muscleName = (muscle: string) => {
  const words = muscle.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

function MusclesCard({ exercise }: { exercise: ExerciseLibraryItem }): JSX.Element {
  const muscles = [...new Set([exercise.muscle_group_primary, ...exercise.muscle_groups_secondary])];
  return (
    <Card variant="elevated" padded={false} style={{ padding: space.lg, gap: space.md }}>
      <CardHeaderRow title="Muscles worked" scope={muscles.map(muscleName).join(' · ')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CHIP_ROW_GAP }}>
        {muscles.map((muscle, i) => (
          <View
            key={muscle}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: CHIP_GAP,
              minHeight: CHIP_HEIGHT,
              paddingHorizontal: CHIP_PADDING,
              borderRadius: radius.pill,
              backgroundColor: i === 0 ? PRIMARY_WASH : SECONDARY_WASH,
            }}
          >
            <Text color={color.label} style={scaled(11.5, '600', 15)}>
              {muscleName(muscle)}
            </Text>
            <Text variant="caption" color={color.secondaryLabel}>
              {i === 0 ? 'Primary' : 'Secondary'}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function GuideCard({ name }: { name: string }): JSX.Element {
  return (
    <Card variant="elevated" padded={false} style={{ padding: space.lg, gap: space.md }}>
      <CardHeaderRow title="Form guide" />
      <View style={{ gap: STEP_GAP }}>
        {guideFor(name).map((step, i) => (
          <View key={step} style={{ flexDirection: 'row', gap: STEP_GAP }}>
            <View
              style={{
                width: STEP_DISC,
                height: STEP_DISC,
                borderRadius: radius.full,
                backgroundColor: color.light1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                color={color.secondaryLabel}
                style={{ ...scaled(11, undefined, 14), fontFamily: ROUNDED_FACE_BY_WEIGHT['600'] }}
              >
                {i + 1}
              </Text>
            </View>
            <Text variant="body" color={color.label} style={{ flex: 1 }}>
              {step}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function Stat({ value, label, sub }: { value: string; label: string; sub: string }): JSX.Element {
  return (
    <View style={{ flex: 1, gap: STAT_GAP }}>
      <Text variant="statSmall" color={color.label}>
        {value}
      </Text>
      <Text color={color.label} style={scaled(13, '500', 17)}>
        {label}
      </Text>
      <Text variant="caption" color={color.tertiaryLabel}>
        {sub}
      </Text>
    </View>
  );
}

export default function ExerciseProgressScreen(): JSX.Element {
  const params = useLocalSearchParams<{ name?: string }>();
  const name = params.name ?? '';
  const title = name || 'Exercise';
  const { progress, loading } = useExerciseProgress(name);
  const { exercises, loading: libraryLoading } = useExercises({ q: name });
  const exercise = exercises.find((ex) => ex.name.toLowerCase() === name.toLowerCase());

  const history = (() => {
    if (loading || libraryLoading) {
      return <Skeleton width="100%" height={180} rounded={radius.xl} />;
    }

    const empty = (
      <EmptyState
        icon="stats-chart"
        title="Not enough data yet"
        message="Log this exercise 3+ times to see progress"
      />
    );

    if (
      !progress ||
      progress.trend === 'insufficient_data' ||
      progress.history.length < 3 ||
      exercise?.exercise_type === 'cardio'
    ) {
      return empty;
    }

    const chartData = progress.history.slice(-HISTORY_SESSIONS); // history is date ASC; chart stays chronological
    const bodyweight = chartData.every((e) => !e.weight);
    const valueOf = (e: (typeof chartData)[number]) =>
      (e.sets ?? 0) * (e.reps ?? 0) * (bodyweight ? 1 : (e.weight ?? 0));
    const maxValue = Math.max(...chartData.map(valueOf));
    if (maxValue === 0) return empty;

    const latest = chartData[chartData.length - 1];
    const unit = bodyweight ? 'reps' : 'kg';
    const bestReps = chartData.reduce((best, e) => ((e.reps ?? 0) > (best.reps ?? 0) ? e : best));
    const best = progress.personal_best;
    const bestStat = bodyweight
      ? { value: `${bestReps.reps ?? 0} reps`, sub: `${bestReps.sets ?? 0} sets · ${shortDate(bestReps.date)}` }
      : best
        ? { value: `${best.weight} kg`, sub: `${best.reps != null ? `${best.reps} reps · ` : ''}${shortDate(best.date)}` }
        : { value: '—', sub: '' };

    return (
      <Card variant="elevated" padded={false} style={{ padding: space.lg, gap: space.md }}>
        <CardHeaderRow title="History" scope={`Last ${HISTORY_SESSIONS} sessions`} />
        <Text variant="footnote" color={color.secondaryLabel} style={{ marginTop: METRIC_LINE_OFFSET }}>
          {bodyweight ? 'Total reps per session' : 'Volume per session'}
        </Text>
        <View>
          <View
            accessible
            accessibilityLabel={chartData.map((e) => `${shortDate(e.date)}, ${formatNumber(valueOf(e))} ${unit}`).join('; ')}
            style={{ flexDirection: 'row', alignItems: 'flex-end', gap: BAR_GAP, height: CHART_HEIGHT }}
          >
            {chartData.map((e, i) => (
              <View
                key={e.date + i}
                style={{
                  flex: 1,
                  height: `${Math.max(MIN_BAR_PERCENT, Math.round((valueOf(e) / maxValue) * 100))}%`,
                  borderTopLeftRadius: BAR_RADIUS,
                  borderTopRightRadius: BAR_RADIUS,
                  backgroundColor: i === chartData.length - 1 ? color.primary : color.light2,
                }}
              />
            ))}
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: BAR_GAP,
              paddingTop: space.sm,
              borderTopWidth: layout.hairline,
              borderTopColor: surface.divider,
            }}
          >
            {chartData.map((e, i) => {
              const isLast = i === chartData.length - 1;
              return (
                <Text
                  key={e.date + i}
                  color={isLast ? color.secondaryLabel : color.tertiaryLabel}
                  numberOfLines={1}
                  style={[scaled(10, isLast ? '600' : '400', 14), { flex: 1, textAlign: 'center' }]}
                >
                  {/* Every other bar is labelled, anchored to the newest. */}
                  {(chartData.length - 1 - i) % 2 === 0 ? shortDate(e.date) : ''}
                </Text>
              );
            })}
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            gap: space.md,
            paddingTop: space.md,
            borderTopWidth: layout.hairline,
            borderTopColor: surface.divider,
          }}
        >
          <Stat value={`${formatNumber(valueOf(latest))} ${unit}`} label="Latest session" sub={shortDate(latest.date)} />
          <Stat value={bestStat.value} label="Best set" sub={bestStat.sub} />
        </View>
      </Card>
    );
  })();

  return (
    <Screen variant="floating" showBack>
      <View style={{ gap: space.lg }}>
        <View style={{ gap: TITLE_GAP }}>
          <Text variant="title1" color={color.label} accessibilityRole="header">
            {title}
          </Text>
          {exercise ? (
            <Text variant="footnote" color={color.secondaryLabel}>
              {muscleName(exercise.muscle_group_primary)}
            </Text>
          ) : null}
        </View>
        {exercise ? <MusclesCard exercise={exercise} /> : null}
        <GuideCard name={name} />
        {history}
      </View>
    </Screen>
  );
}
