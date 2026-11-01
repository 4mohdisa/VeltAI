// My Schedule — the 7-day weekly plan. Each row shows the assigned workout (or
// "Rest day"); tapping opens a sheet to pick a rest day, one of the user's
// templates, or jump to create a new one. Schedule writes are best-effort: the
// row updates optimistically so the choice sticks even if the API call fails.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { showToast } from '@/components/display/toastStore';
import { Card } from '@/components/display/Card';
import { EmptyState } from '@/components/display/EmptyState';
import { Skeleton } from '@/components/display';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { Screen } from '@/components/navigation/Screen';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { api } from '@/lib/api';
import { useSchedule, useTemplates } from '@/lib/data/gymSchedule';
import { categoryAccent, color, layout, radius, space, surface } from '@/lib/design/tokens';
import { navigate } from '@/lib/nav';
import type { ScheduleDay, WorkoutTemplate } from '@/lib/types';

/** Weekday gutter — every workout name starts on one edge (design §3.6). */
const DAY_WIDTH = 42;
/** The design's gap between a workout's three lines, tighter than the spacing scale. */
const WORKOUT_TEXT_GAP = 3;

export default function ScheduleScreen() {
  const { schedule, loading: sLoading, refetch } = useSchedule();
  const { templates, loading: tLoading } = useTemplates();
  // Optimistic per-day overrides keyed by day_of_week — render these over the
  // fetched rows so a choice shows immediately, even offline.
  const [overrides, setOverrides] = useState<Record<number, ScheduleDay>>({});
  const [activeDay, setActiveDay] = useState<ScheduleDay | null>(null);

  const loading = sLoading || tLoading;

  const rowFor = (day: ScheduleDay): ScheduleDay => overrides[day.day_of_week] ?? day;

  const choose = async (day: ScheduleDay, templateId: string | null) => {
    const template = templateId ? templates.find((t) => t.id === templateId) ?? null : null;
    const optimistic: ScheduleDay = {
      day_of_week: day.day_of_week,
      day_name: day.day_name,
      is_rest_day: templateId === null,
      template_id: templateId,
      template,
    };
    setOverrides((o) => ({ ...o, [day.day_of_week]: optimistic }));
    setActiveDay(null);
    try {
      await api.gym.setScheduleDay(day.day_of_week, templateId);
    } catch {
      // Roll back the optimistic row — nothing was persisted anywhere.
      setOverrides((o) => {
        const next = { ...o };
        delete next[day.day_of_week];
        return next;
      });
      showToast({ message: 'Could not save schedule — check your connection', tone: 'error' });
    }
    refetch();
  };

  const openCreate = () => {
    setActiveDay(null);
    navigate('/gym/new-template');
  };

  return (
    <Screen variant="floating" eyebrow="Gym" title="My schedule" showBack>
      {loading ? (
        <View style={{ gap: space.md }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} width="100%" height={64} rounded={radius.md} />
          ))}
        </View>
      ) : templates.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Create your first workout to build a schedule"
          message="Once you have a workout template you can assign it to any day."
          actionLabel="Create Template"
          onAction={() => navigate('/gym/new-template')}
        />
      ) : (
        /* The design keeps the whole week in ONE elevated card, rows split by a
           hairline: day label, a trained dot, the workout, then a chevron. */
        <Card variant="elevated" padded={false}>
          {schedule.map((day, i) => {
            const row = rowFor(day);
            return (
              <Pressable
                key={day.day_of_week}
                onPress={() => setActiveDay(day)}
                haptic={false}
                minTapTarget={false}
                accessibilityLabel={`${day.day_name}, ${row.template ? row.template.name : 'rest day'}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  minHeight: layout.buttonHeight,
                  paddingVertical: space.md,
                  paddingHorizontal: space.lg,
                  borderTopWidth: i === 0 ? 0 : layout.hairline,
                  borderTopColor: surface.divider,
                }}
              >
                {/* The design's three-letter day ("Mon"); the full name clipped
                    to "Tues…" in this column. VoiceOver still reads it in full
                    from the row's accessibilityLabel. */}
                <Text variant="label" color={color.label} style={{ width: DAY_WIDTH }} numberOfLines={1}>
                  {day.day_name.slice(0, 3)}
                </Text>
                <View
                  style={{
                    width: space.sm,
                    height: space.sm,
                    borderRadius: radius.full,
                    backgroundColor: row.template ? categoryAccent.streak : color.light2,
                  }}
                />
                <View style={{ flex: 1, gap: space.xs }}>
                  <Text
                    variant="callout"
                    color={row.template ? color.label : color.secondaryLabel}
                    numberOfLines={1}
                  >
                    {row.template ? row.template.name : 'Rest day'}
                  </Text>
                  <Text variant="footnote" color={color.tertiaryLabel} numberOfLines={1}>
                    {row.template
                      ? `${row.template.exercises.length} exercise${row.template.exercises.length === 1 ? '' : 's'}`
                      : 'No workout assigned'}
                  </Text>
                </View>
                {/* Decorative — the row itself carries the label and the action. */}
                <Icon name="chevron-forward" size={14} color={color.tertiaryLabel} />
              </Pressable>
            );
          })}
        </Card>
      )}

      {!loading && templates.length > 0 ? <MyWorkouts templates={templates} days={schedule.map(rowFor)} /> : null}

      <BottomSheet
        visible={activeDay !== null}
        onClose={() => setActiveDay(null)}
        title={activeDay ? `${activeDay.day_name} — Choose Workout` : undefined}
      >
        {activeDay ? (
          <ScrollView style={{ maxHeight: 340 }}>
            <SheetRow
              label="Rest day"
              selected={rowFor(activeDay).template_id === null}
              onPress={() => choose(activeDay, null)}
            />
            {templates.map((t) => (
              <SheetRow
                key={t.id}
                label={t.name}
                sublabel={`${t.exercises.length} exercise${t.exercises.length === 1 ? '' : 's'}`}
                selected={rowFor(activeDay).template_id === t.id}
                onPress={() => choose(activeDay, t.id)}
              />
            ))}
            <SheetRow label="Create new template →" onPress={openCreate} />
          </ScrollView>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

/** The exercises' primary muscles in plan order, as the design words them: "Chest · shoulders". */
function musclePhrase(template: WorkoutTemplate): string {
  const muscles = new Set(template.exercises.flatMap((te) => te.exercise?.muscle_group_primary ?? []));
  const phrase = [...muscles].join(' · ').replace(/_/g, ' ');
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

function MyWorkouts({ templates, days }: { templates: WorkoutTemplate[]; days: ScheduleDay[] }) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: space.md }}>
      <Text
        variant="label"
        color={color.secondaryLabel}
        style={{ paddingHorizontal: space.xs, letterSpacing: 1.1, textTransform: 'uppercase' }}
      >
        {t('gym.myWorkouts')}
      </Text>
      {templates.map((template) => {
        const count = t('gym.exerciseCount', { count: template.exercises.length });
        const muscles = musclePhrase(template);
        const sub = muscles ? `${count} · ${muscles}` : count;
        // Monday first, as the design lists them.
        const scheduled = days
          .filter((day) => day.template_id === template.id)
          .sort((a, b) => (a.day_of_week + 6) % 7 - (b.day_of_week + 6) % 7)
          .map((day) => day.day_name.slice(0, 3));
        const when = scheduled.length > 0 ? t('gym.everyDays', { days: scheduled.join(', ') }) : t('gym.notScheduled');
        return (
          <Card
            key={template.id}
            variant="elevated"
            padded={false}
            onPress={() => navigate(`/gym/new-template?id=${template.id}`)}
            accessibilityLabel={`${template.name}, ${sub}, ${when}`}
            style={{ borderRadius: radius.lg, padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}
          >
            <View style={{ flex: 1, gap: WORKOUT_TEXT_GAP }}>
              <Text variant="bodyMedium" color={color.label}>
                {template.name}
              </Text>
              <Text variant="footnote" color={color.secondaryLabel}>
                {sub}
              </Text>
              <Text variant="caption" color={color.tertiaryLabel}>
                {when}
              </Text>
            </View>
            {/* Decorative — the card carries the label and the action. */}
            <Icon name="chevron-forward" size={14} color={color.gray400} />
          </Card>
        );
      })}
    </View>
  );
}

function SheetRow({
  label,
  sublabel,
  selected,
  onPress,
}: {
  label: string;
  sublabel?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      haptic={false}
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space.md,
        paddingVertical: space.md,
        borderTopWidth: 1,
        borderTopColor: surface.divider,
      }}
    >
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="bodyMedium" color={color.label} numberOfLines={1}>
          {label}
        </Text>
        {sublabel ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color.black,
          }}
        >
          <Icon name="checkmark" size={14} color={color.white} />
        </View>
      ) : null}
    </Pressable>
  );
}
