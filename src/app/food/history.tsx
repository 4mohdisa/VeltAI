// C12 · Meal history
// List by date, descending. Each day shows date, total calories, and gym status
// (checkmark or dash). Plain rows — no per-day drill-down view exists yet.
//
// This screen used to render a module-level literal array of six days
// ('Today 1240 kcal', 'Yesterday 2080 kcal', …) as the user's own history, with
// a 600 ms fake loading state and a pull-to-refresh that spun for 700 ms and
// changed nothing. It now fetches the real per-day totals from
// /api/food/summary and the real sessions from the gym store.
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { ErrorState } from '@/components/display/ErrorState';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';
import { formatCalories } from '@/lib/formatting';
import { api } from '@/lib/api';

const DAYS = 7;

type DayRow = { iso: string; label: string; kcal: number; gym: boolean };

/** Local-calendar ISO date `offset` days before today (not UTC — a user logging
 *  at 9pm must not see their evening meals land on tomorrow). */
function isoDaysAgo(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function labelFor(offset: number, iso: string): string {
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Yesterday';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function MealHistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [rows, setRows] = useState<DayRow[]>([]);

  const load = useCallback(async () => {
    const days = Array.from({ length: DAYS }, (_, i) => ({ offset: i, iso: isoDaysAgo(i) }));
    // Sessions come from the API rather than the gym store: the store's mapper
    // converts date to a display label ('Today', 'Mon 14 Jul') and loses the ISO
    // day we need to match against, so the store cannot answer this question.
    const gymRows = await api.gym.listSessions();
    const gymDays = new Set(gymRows.map((r) => r.date));
    // One request per day: /api/food/summary is per-date. A failure on any day
    // fails the screen rather than showing a partial history that reads as
    // "you ate nothing that day".
    const summaries = await Promise.all(days.map((d) => api.foodLogs.summary(d.iso)));
    setRows(
      days.map((d, i) => ({
        iso: d.iso,
        label: labelFor(d.offset, d.iso),
        kcal: summaries[i]?.calories ?? 0,
        gym: gymDays.has(d.iso),
      })),
    );
  }, []);

  useEffect(() => {
    let alive = true;
    load()
      .then(() => alive && setError(null))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e : new Error('Could not load history')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [load]);

  const onRefresh = useCallback(() => {
    haptics.impactLight(); // pull-to-refresh trigger
    setRefreshing(true);
    load()
      .then(() => setError(null))
      .catch((e: unknown) => setError(e instanceof Error ? e : new Error('Could not load history')))
      .finally(() => setRefreshing(false));
  }, [load]);

  // A day with no logged food is a real answer, but a history of nothing but
  // zeroes is just noise — treat "never logged anything" as empty.
  const hasAnything = rows.some((r) => r.kcal > 0 || r.gym);

  return (
    <Screen grouped title="Meal history" showBack backLabel="Food" refreshing={refreshing} onRefresh={onRefresh}>
      {loading ? (
        <SkeletonList rows={5} />
      ) : error ? (
        <ErrorState
          message="Couldn't load your history."
          onRetry={() => {
            setLoading(true);
            void load()
              .then(() => setError(null))
              .catch((e: unknown) => setError(e instanceof Error ? e : new Error('Could not load history')))
              .finally(() => setLoading(false));
          }}
        />
      ) : !hasAnything ? (
        <EmptyState
          icon="clock"
          title="No history yet"
          message="Your logged days will appear here once you start tracking meals."
        />
      ) : (
        <Card padded={false}>
          {rows.map((day, i) => (
            <View
              key={day.iso}
              accessible
              accessibilityLabel={`${day.label}, ${formatCalories(day.kcal)}, gym ${day.gym ? 'done' : 'missed'}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                padding: space.lg,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: color.gray100,
              }}
            >
              <View style={{ flex: 1, gap: space.xs }}>
                <Text variant="bodyBold" color={color.black}>
                  {day.label}
                </Text>
                <Text variant="footnote" color={color.gray500}>
                  {formatCalories(day.kcal)}
                </Text>
              </View>
              <Icon
                name={day.gym ? 'checkmark-circle' : 'remove-circle-outline'}
                size={20}
                color={day.gym ? color.black : color.gray400}
              />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
