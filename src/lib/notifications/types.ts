// Notification settings and schedule types (Row 10a). Pure data: no Expo or
// permission code lives here.
import type { MealSlot } from '@/lib/mock/data';

export type NotificationCategory =
  | 'meal_reminder'
  | 'workout_reminder'
  | 'streak_at_risk'
  | 'weekly_summary'
  | 'promotional';

/** Local minutes from midnight, 0 to 1439. */
export type LocalMinutes = number;

/** Start inclusive, end exclusive. A start after the end wraps past midnight. */
export type QuietHours = { start: LocalMinutes; end: LocalMinutes };

export type NotificationSettings = {
  /** Per category switches. Promotional has its own opt in instead. */
  enabled: Record<Exclude<NotificationCategory, 'promotional'>, boolean>;
  quietHours: QuietHours | null;
  promotionalOptIn: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: { meal_reminder: true, workout_reminder: true, streak_at_risk: true, weekly_summary: true },
  quietHours: { start: 22 * 60, end: 7 * 60 },
  promotionalOptIn: false,
};

/** Recent logging times per meal slot, in local minutes from midnight. */
export type MealLogTimes = Partial<Record<MealSlot, LocalMinutes[]>>;

export type ScheduledNotification = {
  category: NotificationCategory;
  fireAt: Date;
  titleKey: string;
  slot?: MealSlot;
};
