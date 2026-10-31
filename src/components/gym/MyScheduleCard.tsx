// MyScheduleCard — the next three days of the weekly plan, in the design file's
// card language: an elevated white card, a CardHeaderRow with the planned-day
// count, and one row each for today, tomorrow and the day after. Tapping anywhere
// opens the full week. Self-contained via useSchedule(); renders nothing until
// the schedule has loaded, or if the read failed.
import { useCallback } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, CardHeaderRow } from '@/components/display';
import { Text } from '@/components/primitives/Text';
import { useSchedule } from '@/lib/data/gymSchedule';
import { categoryAccent, color, layout, radius, space, surface } from '@/lib/design/tokens';

/** Weekday gutter — every workout name starts on one edge. */
const DAY_WIDTH = 64;
const ROW_MIN_HEIGHT = 48;

export function MyScheduleCard() {
  const { t } = useTranslation();
  const { schedule, refetch } = useSchedule();
  // This tab stays mounted under the schedule screen: re-read on the way back so
  // an edit made there shows here.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (schedule.length === 0) return null;

  const now = new Date();
  const planned = t('gym.daysPlanned', { count: schedule.filter((day) => day.template).length });
  const rows = [0, 1, 2].map((offset) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const template = schedule.find((day) => day.day_of_week === date.getDay())?.template ?? null;
    return {
      offset,
      template,
      label:
        offset === 0
          ? t('foodLog.today')
          : offset === 1
            ? t('gym.tomorrow')
            : date.toLocaleDateString(undefined, { weekday: 'short' }),
      name: template ? template.name : t('gymLog.restDayTitle'),
    };
  });

  return (
    <Card
      variant="elevated"
      padded={false}
      onPress={() => router.push('/gym/schedule' as Href)}
      accessibilityLabel={[t('gym.mySchedule'), planned, ...rows.map((row) => `${row.label}, ${row.name}`)].join(', ')}
      style={{ padding: space.lg, gap: space.md }}
    >
      <CardHeaderRow title={t('gym.mySchedule')} scope={planned} chevron />
      <View>
        {rows.map(({ offset, template, label, name }) => (
          <View
            key={offset}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              minHeight: ROW_MIN_HEIGHT,
              borderTopWidth: offset === 0 ? 0 : layout.hairline,
              borderTopColor: surface.divider,
            }}
          >
            <Text
              variant="label"
              color={offset === 0 ? color.label : color.secondaryLabel}
              style={{ width: DAY_WIDTH }}
              numberOfLines={1}
            >
              {label}
            </Text>
            <View
              style={{
                width: space.sm,
                height: space.sm,
                borderRadius: radius.full,
                backgroundColor: template ? categoryAccent.streak : color.light2,
              }}
            />
            <Text
              variant="callout"
              color={template ? color.label : color.secondaryLabel}
              style={{ flex: 1 }}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text variant="footnote" color={color.tertiaryLabel} numberOfLines={1}>
              {template ? t('gym.exerciseCount', { count: template.exercises.length }) : t('gym.nothingPlanned')}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
