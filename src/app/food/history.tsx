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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { ErrorState } from '@/components/display/ErrorState';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { Text } from '@/components/primitives/Text';
import { color, layout, space } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';
import { dateLocale, formatCalories } from '@/lib/formatting';
import { api } from '@/lib/api';
import { GYM_SESSION_HYDRATE_LIMIT } from '@/lib/data/hooks';

const DAYS = 7;

type DayRow = { iso: string; offset: number; kcal: number; gym: boolean };

/** Local-calendar ISO date `offset` days before today (not UTC — a user logging
 *  at 9pm must not see their evening meals land on tomorrow). */
function isoDaysAgo(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "Today" / "Yesterday", else a short date in the app language (not the device's). */
function labelFor(offset: number, iso: string, t: TFunction, language: string): string {
  if (offset === 0) return t('foodLog.today');
  if (offset === 1) return t('history.yesterday');
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(dateLocale(language), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** The thrown value as an Error; the message is never shown to the user. */
const asLoadError = (e: unknown): Error => (e instanceof Error ? e : new Error('Could not load history'));

export default function MealHistoryScreen() {
  const { t, i18n } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [rows, setRows] = useState<DayRow[]>([]);

  const load = useCallback(async () => {
    const days = Array.from({ length: DAYS }, (_, i) => ({ offset: i, iso: isoDaysAgo(i) }));
    // Sessions come from the API rather than the gym store: the store's mapper
    // converts date to a display label ('Today', 'Mon 14 Jul') and loses the ISO
    // day we need to match against, so the store cannot answer this question.
    const gymRows = await api.gym.listSessions({
      from: days[DAYS - 1].iso,
      limit: GYM_SESSION_HYDRATE_LIMIT,
    });
    const gymDays = new Set(gymRows.map((r) => r.date));
    // One request per day: /api/food/summary is per-date. A failure on any day
    // fails the screen rather than showing a partial history that reads as
    // "you ate nothing that day".
    const summaries = await Promise.all(days.map((d) => api.foodLogs.summary(d.iso)));
    setRows(
      days.map((d, i) => ({
        iso: d.iso,
        offset: d.offset,
        kcal: summaries[i]?.calories ?? 0,
        gym: gymDays.has(d.iso),
      })),
    );
  }, []);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        await load();
        if (alive) setError(null);
      } catch (e) {
        if (alive) setError(asLoadError(e));
      } finally {
        if (alive) setLoading(false);
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [load]);

  const onRefresh = useCallback(() => {
    haptics.impactLight(); // pull-to-refresh trigger
    setRefreshing(true);
    load()
      .then(() => setError(null))
      .catch((e: unknown) => setError(asLoadError(e)))
      .finally(() => setRefreshing(false));
  }, [load]);

  // A day with no logged food is a real answer, but a history of nothing but
  // zeroes is just noise — treat "never logged anything" as empty.
  const hasAnything = rows.some((r) => r.kcal > 0 || r.gym);

  return (
    <Screen
      grouped
      title={t('foodLog.mealHistory')}
      showBack
      backLabel={t('food.title')}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {loading ? (
        <SkeletonList rows={5} />
      ) : error ? (
        <ErrorState
          message={t('history.loadFailed')}
          onRetry={() => {
            setLoading(true);
            void load()
              .then(() => setError(null))
              .catch((e: unknown) => setError(asLoadError(e)))
              .finally(() => setLoading(false));
          }}
        />
      ) : !hasAnything ? (
        <EmptyState
          icon="clock"
          title={t('history.emptyTitle')}
          message={t('history.emptyMessage')}
        />
      ) : (
        <Card padded={false}>
          {rows.map((day, i) => {
            const label = labelFor(day.offset, day.iso, t, i18n.language);
            return (
              <View
                key={day.iso}
                accessible
                accessibilityLabel={t(day.gym ? 'history.rowGymDone' : 'history.rowGymMissed', {
                  day: label,
                  energy: formatCalories(day.kcal),
                })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  padding: space.lg,
                  borderTopWidth: i === 0 ? 0 : layout.hairline,
                  borderTopColor: color.gray100,
                }}
              >
                <View style={{ flex: 1, gap: space.xs }}>
                  <Text variant="bodyBold" color={color.black}>
                    {label}
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
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
