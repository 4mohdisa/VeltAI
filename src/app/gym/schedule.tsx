// My Schedule — the 7-day weekly plan. Each row shows the assigned workout (or
// "Rest day"); tapping opens a sheet to pick one of the user's templates or a
// rest day. Schedule writes are best-effort: the row updates optimistically so
// the choice sticks even if the API call fails.
import { useState } from 'react';
import { PixelRatio, ScrollView, useWindowDimensions, View, type TextStyle } from 'react-native';
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
import { categoryAccent, color, layout, opacity, radius, space, surface } from '@/lib/design/tokens';
import { navigate } from '@/lib/nav';
import type { ScheduleDay, WorkoutTemplate } from '@/lib/types';

/** Weekday gutter — every workout name starts on one edge (design §3.6). */
const DAY_WIDTH = 42;
/** The design's day labels, indexed by day_of_week (0 = Sunday). */
const WEEK_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** The design's gap between a workout's three lines, tighter than the spacing scale. */
const WORKOUT_TEXT_GAP = 3;
const WEEK_ROW_MIN_HEIGHT = 58;
const WEEK_ROW_DOT = 9;
const WEEK_ROW_TEXT_GAP = 1;
const WEEK_ROW_PRESSED_OPACITY = 0.6;
const SHEET_ROW_MIN_HEIGHT = 56;
const SHEET_ROW_TEXT_GAP = 1;
const SHEET_TICK = 17;
const SHEET_LIST_MAX_HEIGHT = 0.7;

const dayLabelStyle = (): TextStyle => ({ fontSize: 15, fontWeight: '600', lineHeight: 20 * PixelRatio.getFontScale() });
const sheetRowNameStyle = (): TextStyle => ({ fontSize: 15, fontWeight: '500', lineHeight: 20 * PixelRatio.getFontScale() });

export default function ScheduleScreen() {
  const { schedule, loading: sLoading, refetch } = useSchedule();
  const { templates, loading: tLoading } = useTemplates();
  // Optimistic per-day overrides keyed by day_of_week — render these over the
  // fetched rows so a choice shows immediately, even offline.
  const [overrides, setOverrides] = useState<Record<number, ScheduleDay>>({});
  const [activeDay, setActiveDay] = useState<ScheduleDay | null>(null);
  const { height: windowHeight } = useWindowDimensions();

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

  return (
    <Screen variant="floating" title="My schedule" showBack contentStyle={{ gap: space.xl }}>
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
        <Card variant="elevated" padded={false} style={{ paddingVertical: space.sm, paddingHorizontal: space.lg }}>
          {[...schedule].sort((a, b) => (a.day_of_week + 6) % 7 - (b.day_of_week + 6) % 7).map((day, i) => {
            const row = rowFor(day);
            const muscles = row.template ? musclePhrase(row.template) : '';
            return (
              <Pressable
                key={day.day_of_week}
                onPress={() => setActiveDay(day)}
                haptic={false}
                minTapTarget={false}
                accessibilityLabel={`${day.day_name}, ${row.template ? row.template.name : 'rest day'}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  minHeight: WEEK_ROW_MIN_HEIGHT,
                  borderTopWidth: i === 0 ? 0 : layout.hairline,
                  borderTopColor: surface.divider,
                  opacity: pressed ? WEEK_ROW_PRESSED_OPACITY : opacity.full,
                })}
              >
                {/* The design's three-letter day ("Mon"); the full name clipped
                    to "Tues…" in this column. VoiceOver still reads it in full
                    from the row's accessibilityLabel. */}
                <Text color={color.label} style={[dayLabelStyle(), { width: DAY_WIDTH }]} numberOfLines={1}>
                  {WEEK_DAY_LABELS[day.day_of_week]}
                </Text>
                <View
                  style={{
                    width: WEEK_ROW_DOT,
                    height: WEEK_ROW_DOT,
                    borderRadius: radius.full,
                    backgroundColor: row.template ? categoryAccent.streak : color.light2,
                  }}
                />
                <View style={{ flex: 1, gap: WEEK_ROW_TEXT_GAP }}>
                  <Text
                    color={row.template ? color.label : color.secondaryLabel}
                    style={sheetRowNameStyle()}
                    numberOfLines={1}
                  >
                    {row.template ? row.template.name : 'Rest day'}
                  </Text>
                  <Text variant="footnote" color={color.secondaryLabel} numberOfLines={1}>
                    {row.template
                      ? `${row.template.exercises.length} exercise${row.template.exercises.length === 1 ? '' : 's'}${muscles ? ` · ${muscles}` : ''}`
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
        title={activeDay ? `Workout for ${activeDay.day_name}` : undefined}
      >
        {activeDay ? (
          <ScrollView
            style={{ maxHeight: windowHeight * SHEET_LIST_MAX_HEIGHT }}
            contentContainerStyle={{ gap: space.sm }}
          >
            {templates.map((t) => (
              <SheetRow
                key={t.id}
                label={t.name}
                sublabel={`${t.exercises.length} exercise${t.exercises.length === 1 ? '' : 's'}`}
                selected={rowFor(activeDay).template_id === t.id}
                onPress={() => choose(activeDay, t.id)}
              />
            ))}
            <SheetRow
              label="Rest day"
              sublabel="Nothing scheduled"
              selected={rowFor(activeDay).template_id === null}
              onPress={() => choose(activeDay, null)}
            />
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
  sublabel: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      haptic={false}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        minHeight: SHEET_ROW_MIN_HEIGHT,
        paddingHorizontal: space.lg,
        borderRadius: radius.md,
        backgroundColor: pressed ? surface.tilePressed : selected ? surface.tile : 'transparent',
      })}
    >
      <View style={{ flex: 1, gap: SHEET_ROW_TEXT_GAP }}>
        <Text color={color.label} style={sheetRowNameStyle()}>
          {label}
        </Text>
        <Text variant="footnote" color={color.secondaryLabel}>
          {sublabel}
        </Text>
      </View>
      {selected ? <Icon name="checkmark" size={SHEET_TICK} color={color.label} /> : null}
    </Pressable>
  );
}
