// TodayCard — today's scheduled workout at a glance, in the design file's
// session-card shape: an elevated white card headed by a state dot, the plan's
// name, its exercise/duration line and a status pill, with the exercises as
// chips and the Start action beneath. Self-contained via useToday(); a failed
// read shows the load-failed notice with a retry.
import type { JSX } from 'react';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, LoadFailedNotice, Skeleton } from '@/components/display';
import { Button } from '@/components/forms';
import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import type { GymSession } from '@/lib/api';
import { useEnergyBalance } from '@/lib/data/energy';
import { useGymRange } from '@/lib/data/gymRange';
import { useToday } from '@/lib/data/gymSchedule';
import { categoryAccent, color, radius, space, surface } from '@/lib/design/tokens';
import { useUnitPreferences } from '@/lib/settings/store';
import { displayToKg, formatEnergy, formatWeight } from '@/lib/units';

/** The state dot the design puts at the head of the session card. */
function Dot({ tint }: { tint: string }): JSX.Element {
  return <View style={{ width: space.md, height: space.md, borderRadius: radius.full, backgroundColor: tint }} />;
}

/** Status pill — "Logged" (green) / "Planned" / "Rest" (monochrome). */
function StatePill({ label, fill }: { label: string; fill: string }): JSX.Element {
  return (
    <View
      style={{
        paddingVertical: space.xs,
        paddingHorizontal: space.sm,
        borderRadius: radius.pill,
        backgroundColor: fill,
      }}
    >
      <Text variant="caption" color={color.label}>
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
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        backgroundColor: surface.tile,
      }}
    >
      <Text variant="caption" color={muted ? color.secondaryLabel : color.label} numberOfLines={1}>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: space['3xl'] }}>
      <Dot tint={tint} />
      <View style={{ flex: 1, gap: space.xs }}>
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
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text variant="bodyBold" color={color.label} numberOfLines={1} adjustsFontSizeToFit>
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
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
  const duration = today.template.estimated_duration_minutes;
  const count = today.exercises.length;
  const sub =
    `${count} exercise${count === 1 ? '' : 's'} planned` + (duration != null ? ` · about ${duration} min` : '');

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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
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
