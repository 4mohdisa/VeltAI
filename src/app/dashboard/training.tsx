// Training detail — one of the four Summary detail views, all four built to the
// same layout: a coloured kicker over a large title, a hero card (the headline
// stat + a 14-day chart), a secondary card (this week) and a Breakdown list.
//
// Data: GET /api/gym/sessions?from&to for what was logged (dates, names,
// durations) and GET /api/energy-balance/week for the day-level training energy
// (EnergyBalance.calories_out_exercise). Two figures the design shows are NOT
// built: a weekly session target (nothing asks for one) and per-session
// calories (GymSession carries none, and estimating them client-side would be
// inventing the user's own numbers).
//
// A day with sessions but no recorded duration is a GAP, not a zero-minute day.
//
// The layout chrome (kicker, stat line, plot, axis, Breakdown row) is shared
// with the other three detail routes: src/components/display/DetailChart.tsx.
import type { JSX } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { Skeleton } from '@/components/display';
import {
  Axis,
  BreakdownRow,
  ChartHeader,
  HERO_H,
  KickerTitle,
  Plot,
  SEC_H,
  StatLine,
  heroLabels,
  type Col,
} from '@/components/display/DetailChart';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, radius, space } from '@/lib/design/tokens';
import { formatDuration, formatNumber, formatRelativeDate } from '@/lib/formatting';
import { mean, useEnergyRange, weekdayShort } from '@/lib/data/energyRange';
import { minutesByDate, sessionsOn, useGymRange } from '@/lib/data/gymRange';
import type { EnergyBalance } from '@/lib/types';
import type { GymSession } from '@/lib/api';

const RANGE_DAYS = 14;

// ---------------------------------------------------------------------------
// Training bindings
// ---------------------------------------------------------------------------

/** "Push day · 52 min", "Push day", "52 min" — whatever was actually recorded. */
function sessionSummary(sessions: GymSession[]): string {
  const parts = sessions.map((s) =>
    [s.name, s.duration_minutes != null ? formatDuration(s.duration_minutes) : null].filter(Boolean).join(' · '),
  );
  return parts.filter((p) => p.length > 0).join(' · ');
}

export default function TrainingDetailScreen(): JSX.Element {
  const { sessions, dates, loading } = useGymRange(RANGE_DAYS);
  const energy = useEnergyRange();

  return (
    <Screen variant="floating" showBack>
      <KickerTitle kicker="Training" title="Workouts" tint={categoryAccent.positive} />
      {loading ? (
        <>
          <Skeleton height={HERO_H} rounded={radius.xl} />
          <Skeleton height={SEC_H} rounded={radius.xl} />
        </>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="barbell"
          title="No sessions yet"
          message="Log a gym session and it will show up here."
        />
      ) : (
        <Body sessions={sessions} dates={dates} energyDays={energy.days} energyLoading={energy.loading} />
      )}
    </Screen>
  );
}

function Body({
  sessions,
  dates,
  energyDays,
  energyLoading,
}: {
  sessions: GymSession[];
  dates: string[];
  energyDays: EnergyBalance[];
  energyLoading: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  const minutes = minutesByDate(sessions, dates);
  const weekDates = dates.slice(-7);
  const weekMinutes = minutes.slice(-7);

  const weekSessions = weekDates.reduce((n, d) => n + sessionsOn(sessions, d).length, 0);
  const weekTimed = weekMinutes.filter((m): m is number => m != null);
  const weekTotal = weekTimed.reduce((a, b) => a + b, 0);
  const trained = minutes.filter((m): m is number => m != null && m > 0);
  const avgSession = mean(trained);

  // Hero: minutes trained per day. 0 is a real rest day; null is a session
  // whose duration was never recorded, and gets no bar at all.
  const heroScale = Math.max(1, ...trained);
  const heroCols: Col[] = dates.map((d, i) => {
    const m = minutes[i];
    return {
      key: d,
      dim: i !== dates.length - 1,
      bars: m == null || m === 0 ? [] : [{ h: (m / heroScale) * HERO_H, tint: categoryAccent.positive }],
    };
  });

  // Secondary: the day-level training energy the server computed. Per-session
  // calories do not exist, so nothing here is attributed to one session.
  const energyWeek = energyDays.slice(-7);
  const secScale = Math.max(1, ...energyWeek.map((d) => d.calories_out_exercise));
  const secCols: Col[] = energyWeek.map((d) => ({
    key: d.date,
    bars: [{ h: (d.calories_out_exercise / secScale) * SEC_H, tint: categoryAccent.positive }],
  }));
  const gymKcal = energyWeek.reduce((a, d) => a + d.calories_out_exercise, 0);

  const rowMax = Math.max(1, ...trained);

  return (
    <>
      {/* Hero — sessions this week, then fourteen days of minutes. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <StatLine
            value={String(weekSessions)}
            unit={weekSessions === 1 ? 'session this week' : 'sessions this week'}
            sub={weekTotal > 0 ? `${formatDuration(weekTotal)} trained` : undefined}
          />
          <View style={{ gap: space.sm }}>
            <ChartHeader title="Minutes trained" note={`Last ${dates.length} days`} />
            {trained.length === 0 ? (
              <EmptyState
                icon="chart.bar.xaxis"
                title="No durations yet"
                message="Log a session with a duration to see how long you train."
              />
            ) : (
              <>
                <Plot
                  cols={heroCols}
                  height={HERO_H}
                  ceiling={`${formatNumber(heroScale)}m`}
                  summary={`Minutes trained on each of the last ${dates.length} days, longest ${formatNumber(heroScale)} minutes.`}
                />
                <Axis labels={heroLabels(dates)} />
              </>
            )}
          </View>
          {avgSession != null ? (
            <Text variant="footnote" color={color.secondaryLabel}>
              {`${trained.length} of the last ${dates.length} days had a timed session, ${formatDuration(avgSession)} long on average.`}
            </Text>
          ) : null}
        </View>
      </Card>

      {/* Secondary — what the server attributed to training, day by day. */}
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <ChartHeader title="Training energy" note="This week" />
          {energyLoading ? (
            <Skeleton height={SEC_H} rounded={radius.xl} />
          ) : energyWeek.length === 0 ? (
            <EmptyState
              icon="flame"
              title="No energy data"
              message="Lume could not work out what your training burned this week."
            />
          ) : (
            <>
              <Plot
                cols={secCols}
                height={SEC_H}
                ceiling={formatNumber(secScale)}
                summary={`Training energy for each of the last ${energyWeek.length} days, up to ${formatNumber(secScale)} kcal.`}
              />
              <Axis labels={energyWeek.map((d) => weekdayShort(d.date).charAt(0))} />
              <Text variant="footnote" color={color.secondaryLabel}>
                {`${formatNumber(gymKcal)} kcal attributed to training this week.`}
              </Text>
            </>
          )}
        </View>
      </Card>

      {/* Breakdown — every day of this week, and what was logged on it. */}
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <Text variant="bodyMedium" color={color.label} accessibilityRole="header">
            {t('dashboard.breakdown')}
          </Text>
          {weekDates.map((d, i) => {
            const m = weekMinutes[i];
            const onDay = sessionsOn(sessions, d);
            const summary = sessionSummary(onDay);
            return (
              <BreakdownRow
                key={d}
                tint={onDay.length > 0 ? categoryAccent.positive : color.light3}
                label={formatRelativeDate(new Date(`${d}T00:00:00`))}
                sub={onDay.length === 0 ? 'Rest day' : summary.length > 0 ? summary : 'Session logged'}
                value={m == null ? '—' : m === 0 ? '0' : formatNumber(m)}
                unit={m == null ? undefined : 'min'}
                fraction={m == null ? 0 : m / rowMax}
              />
            );
          })}
        </View>
      </Card>

      <Text variant="footnote" color={color.tertiaryLabel} style={{ paddingHorizontal: space.xs }}>
        Sessions and durations come from what you logged. A session without a recorded duration is left blank rather
        than counted as zero minutes.
      </Text>
    </>
  );
}
