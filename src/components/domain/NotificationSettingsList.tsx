// Row 10b · The Notifications group on Settings: one switch per category and the
// quiet hours. Reads and saves the Row 10a settings through the settings store;
// promotional is its own opt in and starts off.
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsList, type SettingsRowProps } from '@/components/display/SettingsList';
import { formatTime } from '@/lib/formatting';
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

  const toggle = (category: NotificationCategory, on: boolean) =>
    setNotifications(
      category === 'promotional' ? { promotionalOptIn: on } : { enabled: { ...settings.enabled, [category]: on } },
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
  });

  return <SettingsList title={t('settings.notifications')} rows={rows} />;
}
