// TodayCard — today's scheduled workout at a glance, in the design file's
// session-card shape: an elevated white card headed by a state dot, the plan's
// name, its exercise-count line and a status pill, with the exercises as
// chips and the Start action beneath. Self-contained via useToday(); a failed
// read shows the load-failed notice with a retry.
import type { JSX } from 'react';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PixelRatio, View, type TextStyle } from 'react-native';

import { Card, LoadFailedNotice, Skeleton } from '@/components/display';
import { Button } from '@/components/forms';
import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import type { GymSession } from '@/lib/api';
import { useEnergyBalance } from '@/lib/data/energy';
import { useGymRange } from '@/lib/data/gymRange';
import { useToday } from '@/lib/data/gymSchedule';
import { categoryAccent, color, radius, ROUNDED_FACE_BY_WEIGHT, space, surface } from '@/lib/design/tokens';
import { useUnitPreferences } from '@/lib/settings/store';
import { displayToKg, formatEnergy, formatWeight } from '@/lib/units';

/** The design's own values for this card. No token covers them. */
const DOT_SIZE = 11;
const HEADER_GAP = 10;
const HEADER_MIN_HEIGHT = 34;
const TITLE_GAP = 1;
const PILL_PADDING_VERTICAL = 3;
const PILL_PADDING_HORIZONTAL = 9;
const CHIP_PADDING_HORIZONTAL = 10;
const CHIP_ROW_GAP = 6;
const STAT_CELL_GAP = 1;

// The design's small type has no exact token. Read at render, and the line height
// scales with the text size as textStyle() does, so large sizes don't clip.
const pillTextStyle = (): TextStyle => ({ fontWeight: '600', lineHeight: 15 * PixelRatio.getFontScale() });
const chipTextStyle = (): TextStyle => ({ fontSize: 12, lineHeight: 16 * PixelRatio.getFontScale() });
const statValueStyle = (): TextStyle => ({
  fontFamily: ROUNDED_FACE_BY_WEIGHT['600'],
  fontSize: 16,
  lineHeight: 21 * PixelRatio.getFontScale(),
});

/** The state dot the design puts at the head of the session card. */
function Dot({ tint }: { tint: string }): JSX.Element {
  return <View style={{ width: DOT_SIZE, height: DOT_SIZE, borderRadius: radius.full, backgroundColor: tint }} />;
}

/** Status pill — "Logged" (green) / "Planned" / "Rest" (monochrome). */
function StatePill({ label, fill }: { label: string; fill: string }): JSX.Element {
  return (
    <View
      style={{
        paddingVertical: PILL_PADDING_VERTICAL,
        paddingHorizontal: PILL_PADDING_HORIZONTAL,
        borderRadius: radius.pill,
        backgroundColor: fill,
      }}
    >
      <Text variant="caption" color={color.label} style={pillTextStyle()}>
        {label}
      </Text>
    </View>
  );
}

/** Exercise chip — the design shows the first three by name, then "+N more". */
function Chip({ label, muted }: { label: string; muted?: boolean }): JSX.Element {
  return (
    <View
      style={{
        minHeight: space['2xl'],
        justifyContent: 'center',
        paddingHorizontal: CHIP_PADDING_HORIZONTAL,
        borderRadius: radius.pill,
        backgroundColor: surface.tile,
      }}
    >
      <Text variant="caption" color={muted ? color.secondaryLabel : color.label} style={chipTextStyle()} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Header({
  tint,
  title,
  sub,
  pill,
  pillFill,
  chevron,
}: {
  tint: string;
  title: string;
  sub?: string;
  pill: string;
  pillFill: string;
  chevron?: boolean;
}): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: HEADER_GAP, minHeight: HEADER_MIN_HEIGHT }}>
      <Dot tint={tint} />
      <View style={{ flex: 1, gap: TITLE_GAP }}>
        <Text variant="bodyMedium" color={color.label} numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text variant="footnote" color={color.secondaryLabel} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      <StatePill label={pill} fill={pillFill} />
      {chevron ? <Icon name="chevron-forward" size={14} color={color.tertiaryLabel} /> : null}
    </View>
  );
}

/** One cell of the logged stats grid; a long value shrinks rather than wraps. */
function StatCell({ value, label }: { value: string; label: string }): JSX.Element {
  return (
    <View style={{ flex: 1, minWidth: 0, gap: STAT_CELL_GAP }}>
      <Text variant="statSmall" color={color.label} style={statValueStyle()} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" color={color.secondaryLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** The logged session's stats and exercise chips. The session row carries no
 *  calories, so that cell is left out, and an unrecorded duration or volume
 *  reads as a dash, never 0. */
function LoggedSessionDetail({ session }: { session: GymSession }): JSX.Element | null {
  const { t } = useTranslation();
  const weightUnit = useUnitPreferences().weight;
  const exercises = session.exercises ?? [];
  if (exercises.length === 0) return null;

  const sets = exercises.reduce((sum, e) => sum + (e.sets ?? 0), 0);
  const volumeKg = exercises.reduce(
    (sum, e) => sum + (e.sets ?? 0) * (e.reps ?? 0) * displayToKg(e.weight ?? 0, e.weight_unit === 'lb' ? 'lb' : 'kg'),
    0,
  );
  const shown = exercises.slice(0, 3);
  const more = exercises.length - shown.length;

  return (
    <>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <StatCell
          value={session.duration_minutes != null ? t('gym.loggedMinutes', { minutes: session.duration_minutes }) : '—'}
          label={t('gym.loggedDuration')}
        />
        <StatCell
          value={volumeKg > 0 ? formatWeight(volumeKg, weightUnit) : '—'}
          label={t('gymLog.celebration.volume')}
        />
        <StatCell value={String(sets)} label={t('gym.loggedSets')} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CHIP_ROW_GAP }}>
        {shown.map((e) => (
          <Chip key={e.id} label={e.name} />
        ))}
        {more > 0 ? <Chip label={t('gym.loggedMore', { extra: more })} muted /> : null}
      </View>
    </>
  );
}

/** Logged state. Owns the balance fetch so the other states never make it. The
 *  burn is the day's total; with none recorded the sub-line stays kcal-free
 *  rather than claiming 0 kcal burned. */
function LoggedCard({ title, sessionId }: { title: string; sessionId: string | null }): JSX.Element {
  const { t } = useTranslation();
  const { balance } = useEnergyBalance();
  const energyUnit = useUnitPreferences().energy;
  const burned = balance?.calories_out_exercise ?? 0;
  const { sessions } = useGymRange(1);
  const session = sessions.find((s) => s.id === sessionId);

  return (
    <Card variant="elevated" padded={false} style={{ padding: space.lg }}>
      <View style={{ gap: space.lg }}>
        <Header
          tint={categoryAccent.positive}
          title={title}
          sub={burned > 0 ? t('gym.loggedTodayBurned', { energy: formatEnergy(burned, energyUnit) }) : t('gym.loggedToday')}
          pill={t('gym.logged')}
          pillFill={categoryAccent.positive}
          chevron
        />
        {session ? <LoggedSessionDetail session={session} /> : null}
      </View>
    </Card>
  );
}

export function TodayCard(): JSX.Element {
  const { t } = useTranslation();
  const { today, loading, refetch } = useToday();

  if (loading) {
    return (
      <Card variant="elevated" padded={false} style={{ padding: space.lg }}>
        <View style={{ gap: space.sm }}>
          <Skeleton width="55%" height={18} />
          <Skeleton width="80%" height={14} />
        </View>
      </Card>
    );
  }

  // useToday yields null only when the read failed; a real response is always an object.
  if (!today) return <LoadFailedNotice message={t('gym.loadFailed')} onRetry={refetch} />;

  if (today.already_checked_in) {
    return <LoggedCard title={today.template?.name ?? t('gymLog.freestyleTitle')} sessionId={today.session_id} />;
  }

  if (today.is_rest_day || !today.template) {
    return (
      <Card variant="elevated" padded={false} style={{ padding: space.lg }}>
        <Header
          tint={color.light2}
          title={t('gymLog.restDayTitle')}
          sub={t('gym.nothingScheduledSub')}
          pill={t('gym.rest')}
          pillFill={color.light1}
        />
      </Card>
    );
  }

  const names: string[] = [];
  for (const ex of today.exercises) {
    const n = ex.exercise?.name;
    if (n) names.push(n);
  }
  const shown = names.slice(0, 3);
  const more = names.length - shown.length;
  const sub = t('gym.plannedExercisesNoDuration', { count: today.exercises.length });

  return (
    <Card variant="elevated" padded={false} style={{ padding: space.lg }}>
      <View style={{ gap: space.lg }}>
        <Header
          tint={categoryAccent.streak}
          title={today.template.name}
          sub={sub}
          pill={t('gym.planned')}
          pillFill={surface.tile}
        />

        {shown.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CHIP_ROW_GAP }}>
            {shown.map((n, i) => (
              <Chip key={i} label={n} />
            ))}
            {more > 0 ? <Chip label={t('gym.loggedMore', { extra: more })} muted /> : null}
          </View>
        ) : null}

        <Button title={t('gym.startWorkout')} onPress={() => router.push('/gym/session' as Href)} />
      </View>
    </Card>
  );
}
