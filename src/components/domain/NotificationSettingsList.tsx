// Row 10b · The Notifications group on Settings: one switch per category and the
// quiet hours. Reads and saves the Row 10a settings through the settings store;
// promotional is its own opt in and starts off. A saved change reschedules the
// device's reminders when notification permission is already granted.
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsList, type SettingsRowProps } from '@/components/display/SettingsList';
import { deviceTimeZone } from '@/lib/api';
import { formatTime } from '@/lib/formatting';
import { applySchedule, notificationPermission } from '@/lib/notifications/device';
import { scheduleNotifications } from '@/lib/notifications/schedule';
import type { LocalMinutes, NotificationCategory } from '@/lib/notifications/types';
import { hydrateNotificationSettings, useSettingsStore } from '@/lib/settings/store';

const CATEGORIES: { category: NotificationCategory; icon: string }[] = [
  { category: 'meal_reminder', icon: 'restaurant-outline' },
  { category: 'workout_reminder', icon: 'barbell-outline' },
  { category: 'streak_at_risk', icon: 'flame-outline' },
  { category: 'weekly_summary', icon: 'calendar-outline' },
  { category: 'promotional', icon: 'notifications-outline' },
];

const clock = (min: LocalMinutes) => formatTime(new Date(2000, 0, 1, 0, min));

export function NotificationSettingsList() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.notifications);
  const setNotifications = useSettingsStore((s) => s.setNotifications);

  useEffect(() => {
    void hydrateNotificationSettings();
  }, []);

  const toggle = async (category: NotificationCategory, on: boolean) => {
    setNotifications(
      category === 'promotional' ? { promotionalOptIn: on } : { enabled: { ...settings.enabled, [category]: on } },
    );
    // Reschedules only when permission is already granted; this screen never prompts.
    if (!(await notificationPermission())) return;
    const saved = useSettingsStore.getState().notifications;
    // ponytail: no per-slot meal logging times exist yet, so meal reminders use the default times.
    // A failed schedule keeps the saved switch; the next change schedules again.
    await applySchedule(scheduleNotifications(new Date(), deviceTimeZone() ?? 'UTC', saved, {})).catch(() => undefined);
  };

  const rows: SettingsRowProps[] = CATEGORIES.map(({ category, icon }) => ({
    icon,
    label: t(`notifications.${category}.label`),
    kind: 'toggle',
    switchValue: category === 'promotional' ? settings.promotionalOptIn : settings.enabled[category],
    onToggle: (on) => void toggle(category, on),
  }));
  const quiet = settings.quietHours;
  rows.push({
    icon: 'moon-outline',
    label: t('notifications.quietHours.label'),
    value: quiet ? t('notifications.quietHours.value', { start: clock(quiet.start), end: clock(quiet.end) }) : undefined,
  });

  return <SettingsList title={t('settings.notifications')} rows={rows} />;
}
