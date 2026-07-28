// My Schedule — the 7-day weekly plan. Each row shows the assigned workout (or
// "Rest day"); tapping opens a sheet to pick a rest day, one of the user's
// templates, or jump to create a new one. Schedule writes are best-effort: the
// row updates optimistically so the choice sticks even if the API call fails.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

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
import { color, radius, space, surface } from '@/lib/design/tokens';
import { navigate } from '@/lib/nav';
import type { ScheduleDay } from '@/lib/types';

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
    <Screen title="My Schedule" showBack>
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
        <View style={{ gap: space.md }}>
          {schedule.map((day) => {
            const row = rowFor(day);
            return (
              <Card key={day.day_of_week} onPress={() => setActiveDay(day)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={{ flex: 1, gap: space.xs }}>
                    <Text variant="bodyBold" color={color.label}>
                      {day.day_name}
                    </Text>
                    {row.template ? (
                      <Text variant="footnote" color={color.secondaryLabel} numberOfLines={1}>
                        {row.template.name} · {row.template.exercises.length} exercise
                        {row.template.exercises.length === 1 ? '' : 's'}
                      </Text>
                    ) : (
                      <Text variant="footnote" color={color.secondaryLabel}>
                        Rest day
                      </Text>
                    )}
                  </View>
                  <Icon name="chevron-forward" size={20} color={color.tertiaryLabel} />
                </View>
              </Card>
            );
          })}
        </View>
      )}

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
