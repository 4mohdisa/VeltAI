// TodayCard — today's scheduled workout at a glance, in the design file's
// session-card shape: an elevated white card headed by a state dot, the plan's
// name, its exercise/duration line and a status pill, with the exercises as
// chips and the Start action beneath. Self-contained via useToday(); renders
// nothing when there's no schedule data.
import type { JSX } from 'react';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Skeleton } from '@/components/display';
import { Button } from '@/components/forms';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useToday } from '@/lib/data/gymSchedule';
import { categoryAccent, color, radius, space, surface } from '@/lib/design/tokens';

/** The state dot the design puts at the head of the session card. */
function Dot({ tint }: { tint: string }): JSX.Element {
  return <View style={{ width: space.md, height: space.md, borderRadius: radius.full, backgroundColor: tint }} />;
}

/** Status pill — "Logged" / "Planned" / "Rest". Monochrome, like the design. */
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
}: {
  tint: string;
  title: string;
  sub?: string;
  pill: string;
  pillFill: string;
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
    </View>
  );
}

export function TodayCard(): JSX.Element | null {
  const { t } = useTranslation();
  const { today, loading } = useToday();

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

  // No backend / not scheduled → render nothing (the gym tab shows other content).
  if (!today) return null;

  if (today.is_rest_day) {
    return (
      <Card variant="elevated" padded={false} style={{ padding: space.lg }}>
        <Header
          tint={color.light2}
          title={t('gymLog.restDayTitle')}
          sub={t('gym.nothingScheduledSub')}
          pill="Rest"
          pillFill={color.light1}
        />
      </Card>
    );
  }

  if (today.already_checked_in) {
    return (
      <Card variant="elevated" padded={false} style={{ padding: space.lg }}>
        <Header
          tint={categoryAccent.positive}
          title={today.template?.name ?? 'Session'}
          sub="Logged today"
          pill="Logged"
          pillFill={color.light1}
        />
      </Card>
    );
  }

  if (today.template) {
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
            pill="Planned"
            pillFill={surface.tile}
          />

          {shown.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {shown.map((n, i) => (
                <Chip key={i} label={n} />
              ))}
              {more > 0 ? <Chip label={`+${more} more`} muted /> : null}
            </View>
          ) : null}

          <Button title="Start workout" onPress={() => router.push('/gym/session' as Href)} />
        </View>
      </Card>
    );
  }

  // Today exists but has no template and isn't a rest day → nothing scheduled.
  return (
    <Card variant="elevated" padded={false} style={{ padding: space.lg }}>
      <View style={{ gap: space.md }}>
        <Header
          tint={color.light2}
          title={t('gymLog.restDayTitle')}
          sub={t('gym.nothingScheduledSub')}
          pill="Rest"
          pillFill={color.light1}
        />
        <Pressable
          onPress={() => router.push('/gym/schedule' as Href)}
          haptic={false}
          minTapTarget={false}
          hitSlop={10}
          accessibilityLabel="Set schedule"
          style={{ alignSelf: 'flex-start' }}
        >
          <Text variant="label" color={color.primary}>
            Set schedule →
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
