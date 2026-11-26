// Row 10b · The Notifications group on Settings: one switch per category and the
// quiet hours. Reads and saves the Row 10a settings through the settings store;
// promotional is its own opt in and starts off. A saved change reschedules the
// device's reminders when notification permission is already granted. Quiet
// hours open a sheet with a start and an end, each saved as it changes.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SettingsList, type SettingsRowProps } from '@/components/display/SettingsList';
import { Stepper } from '@/components/forms/Stepper';
import { BottomSheet } from '@/components/navigation/BottomSheet';
import { space } from '@/lib/design/tokens';
import { formatTime } from '@/lib/formatting';
import { rescheduleToday } from '@/lib/notifications/daily';
import type { LocalMinutes, NotificationCategory, NotificationSettings, QuietHours } from '@/lib/notifications/types';
import { hydrateNotificationSettings, useSettingsStore } from '@/lib/settings/store';

const CATEGORIES: { category: NotificationCategory; icon: string }[] = [
  { category: 'meal_reminder', icon: 'restaurant-outline' },
  { category: 'workout_reminder', icon: 'barbell-outline' },
  { category: 'streak_at_risk', icon: 'flame-outline' },
  { category: 'weekly_summary', icon: 'calendar-outline' },
  { category: 'promotional', icon: 'notifications-outline' },
];

const clock = (min: LocalMinutes) => formatTime(new Date(2000, 0, 1, 0, min));

const QUIET_STEP: LocalMinutes = 15;
const LAST_QUIET_TIME: LocalMinutes = 24 * 60 - QUIET_STEP;

export function NotificationSettingsList() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.notifications);
  const setNotifications = useSettingsStore((s) => s.setNotifications);
  // The times being edited; null while the sheet is closed. Kept apart from the
  // store so an equal start and end can show its error without being saved.
  const [draft, setDraft] = useState<QuietHours | null>(null);

  useEffect(() => {
    void hydrateNotificationSettings();
  }, []);

  // The daily schedule reschedules only when permission is already granted and never prompts.
  const save = (patch: Partial<NotificationSettings>) => {
    setNotifications(patch);
    void rescheduleToday();
  };
  const toggle = (category: NotificationCategory, on: boolean) =>
    save(category === 'promotional' ? { promotionalOptIn: on } : { enabled: { ...settings.enabled, [category]: on } });
  const setQuiet = (edge: keyof QuietHours, min: LocalMinutes) => {
    if (!draft) return;
    const next = { ...draft, [edge]: min };
    setDraft(next);
    if (next.start !== next.end) save({ quietHours: next });
  };
  const quietStepper = (edge: keyof QuietHours, hours: QuietHours) => (
    <Stepper
      label={t(`notifications.quietHours.${edge}`)}
      value={hours[edge]}
      max={LAST_QUIET_TIME}
      step={QUIET_STEP}
      formatValue={clock}
      onChange={(min) => setQuiet(edge, min)}
      error={edge === 'end' && hours.start === hours.end ? t('notifications.quietHours.sameTime') : undefined}
      testID={`quiet-hours-${edge}`}
    />
  );

  const rows: SettingsRowProps[] = CATEGORIES.map(({ category, icon }) => ({
    icon,
    label: t(`notifications.${category}.label`),
    kind: 'toggle',
    switchValue: category === 'promotional' ? settings.promotionalOptIn : settings.enabled[category],
    onToggle: (on) => toggle(category, on),
  }));
  const quiet = settings.quietHours;
  rows.push({
    icon: 'moon-outline',
    label: t('notifications.quietHours.label'),
    value: quiet ? t('notifications.quietHours.value', { start: clock(quiet.start), end: clock(quiet.end) }) : undefined,
    onPress: quiet ? () => setDraft(quiet) : undefined,
  });

  return (
    <>
      <SettingsList title={t('settings.notifications')} rows={rows} />
      <BottomSheet
        visible={draft !== null}
        onClose={() => setDraft(null)}
        title={t('notifications.quietHours.label')}
        testID="quiet-hours-sheet"
      >
        {draft ? (
          <View style={{ gap: space.xl }}>
            {quietStepper('start', draft)}
            {quietStepper('end', draft)}
          </View>
        ) : null}
      </BottomSheet>
    </>
  );
}
