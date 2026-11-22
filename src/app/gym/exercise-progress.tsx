// Per-exercise progress screen. Reads the `name` route param and shows the
// design's exercise detail: the muscles worked, the form guide, and the History
// card (a bar per session of volume or reps, and the latest and best stats). The
// History card degrades to an empty state when there aren't enough logs, for
// cardio (the progress read carries no minutes), or when the read returns null.
// A failed progress read shows the LoadFailedNotice instead of the empty state.
import type { JSX } from 'react';
import { PixelRatio, View, type TextStyle } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, CardHeaderRow, EmptyState, Skeleton } from '@/components/display';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { Screen } from '@/components/navigation/Screen';
import { Text } from '@/components/primitives/Text';
import { useExerciseProgress, useExercises } from '@/lib/data/gymSchedule';
import { categoryAccent, color, layout, radius, ROUNDED_FACE_BY_WEIGHT, space, surface } from '@/lib/design/tokens';
import { formatNumber } from '@/lib/formatting';
import { dayMonth } from '@/lib/data/energyRange';
import type { ExerciseLibraryItem } from '@/lib/types';

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

// The design's form guide, chosen from the exercise's name. Each kind is a
// three-step list under gymExerciseProgress.guide in the locale files.
function guideFor(name: string): string {
  const s = name.toLowerCase();
  if (/squat|leg press/.test(s)) return 'squat';
  if (/deadlift|romanian|hip thrust/.test(s)) return 'hinge';
  if (/row|pulldown|pull-up|pullup/.test(s)) return 'row';
  if (/curl/.test(s)) return 'curl';
  if (/raise/.test(s)) return 'raise';
  if (/pushdown|dip|extension/.test(s)) return 'push';
  if (/press|fly/.test(s)) return 'press';
  if (/treadmill|bike|rowing machine|elliptical/.test(s)) return 'cardio';
  return 'other';
}

const muscleName = (muscle: string) => {
  const words = muscle.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

function MusclesCard({ exercise }: { exercise: ExerciseLibraryItem }): JSX.Element {
  const { t } = useTranslation();
  const muscles = [...new Set([exercise.muscle_group_primary, ...exercise.muscle_groups_secondary])];
  return (
    <Card variant="elevated" padded={false} style={{ padding: space.lg, gap: space.md }}>
      <CardHeaderRow title={t('gymExerciseProgress.musclesWorked')} scope={muscles.map(muscleName).join(' · ')} />
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
              {i === 0 ? t('gymExerciseProgress.primary') : t('gymExerciseProgress.secondary')}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function GuideCard({ name }: { name: string }): JSX.Element {
  const { t } = useTranslation();
  const steps = t(`gymExerciseProgress.guide.${guideFor(name)}`, { returnObjects: true }) as string[];
  return (
    <Card variant="elevated" padded={false} style={{ padding: space.lg, gap: space.md }}>
      <CardHeaderRow title={t('gymExerciseProgress.formGuide')} />
      <View style={{ gap: STEP_GAP }}>
        {steps.map((step, i) => (
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
  const { t } = useTranslation();
  const title = name || t('gymExerciseProgress.exerciseFallback');
  const { progress, loading, isError } = useExerciseProgress(name);
  const { exercises, loading: libraryLoading } = useExercises({ q: name });
  const exercise = exercises.find((ex) => ex.name.toLowerCase() === name.toLowerCase());

  const history = (() => {
    if (loading || libraryLoading) {
      return <Skeleton width="100%" height={180} rounded={radius.xl} />;
    }

    if (isError && !progress) {
      // ponytail: no Retry, useExerciseProgress exposes no refetch (src/lib/data is off limits)
      return <LoadFailedNotice message={t('gym.loadFailed')} />;
    }

    const empty = (
      <EmptyState
        icon="stats-chart"
        title={t('gymExerciseProgress.emptyTitle')}
        message={t('gymExerciseProgress.emptyMessage')}
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
    const amount = (value: string) =>
      bodyweight ? t('gymExerciseProgress.repsValue', { value }) : t('gymExerciseProgress.kgValue', { value });
    const bestReps = chartData.reduce((best, e) => ((e.reps ?? 0) > (best.reps ?? 0) ? e : best));
    const best = progress.personal_best;
    const bestStat = bodyweight
      ? {
          value: t('gymExerciseProgress.repsValue', { value: bestReps.reps ?? 0 }),
          sub: t('gymExerciseProgress.setsOnDate', { sets: bestReps.sets ?? 0, date: dayMonth(bestReps.date) }),
        }
      : best
        ? {
            value: t('gymExerciseProgress.kgValue', { value: best.weight }),
            sub:
              best.reps != null
                ? t('gymExerciseProgress.repsOnDate', { reps: best.reps, date: dayMonth(best.date) })
                : dayMonth(best.date),
          }
        : { value: '—', sub: '' };

    return (
      <Card variant="elevated" padded={false} style={{ padding: space.lg, gap: space.md }}>
        <CardHeaderRow
          title={t('gymExerciseProgress.history')}
          scope={t('gymExerciseProgress.lastSessions', { count: HISTORY_SESSIONS })}
        />
        <Text variant="footnote" color={color.secondaryLabel} style={{ marginTop: METRIC_LINE_OFFSET }}>
          {bodyweight ? t('gymExerciseProgress.totalRepsPerSession') : t('gymExerciseProgress.volumePerSession')}
        </Text>
        <View>
          <View
            accessible
            accessibilityLabel={chartData.map((e) => `${dayMonth(e.date)}, ${amount(formatNumber(valueOf(e)))}`).join('; ')}
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
                  {(chartData.length - 1 - i) % 2 === 0 ? dayMonth(e.date) : ''}
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
          <Stat
            value={amount(formatNumber(valueOf(latest)))}
            label={t('gymExerciseProgress.latestSession')}
            sub={dayMonth(latest.date)}
          />
          <Stat value={bestStat.value} label={t('gymExerciseProgress.bestSet')} sub={bestStat.sub} />
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
