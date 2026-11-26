// Row 10 · Puts the list from scheduleNotifications on the device. The second
// file allowed to import expo-notifications (permissions.ts asks; this one only
// reads the permission and schedules). Every notification Lume schedules gets an
// identifier starting with REMINDER_PREFIX, so a reschedule cancels only Lume's
// own and leaves anything else scheduled on the device alone.
import * as Notifications from 'expo-notifications';

import i18n from '@/lib/i18n';
import type { ScheduledNotification } from './types';

export const REMINDER_PREFIX = 'lume.reminder.';

/** True only when permission is already granted. Never shows the system prompt. */
export async function notificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === Notifications.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

const identifierFor = (n: ScheduledNotification) =>
  `${REMINDER_PREFIX}${n.category}.${n.slot ?? 'all'}.${n.fireAt.getTime()}`;

async function cancelOwn(identifiers: string[]): Promise<void> {
  await Promise.all(identifiers.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/** Cancels every notification Lume scheduled (REMINDER_PREFIX) and nothing else. */
export async function clearReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await cancelOwn(scheduled.map((r) => r.identifier).filter((id) => id.startsWith(REMINDER_PREFIX)));
}

/** Replaces Lume's scheduled notifications with `list`. If one fails to
 *  schedule, the ones this call already scheduled are cancelled and the call
 *  rejects, so the device never keeps half a schedule. */
export async function applySchedule(list: ScheduledNotification[]): Promise<void> {
  await clearReminders();

  const added: string[] = [];
  for (const n of list) {
    const identifier = identifierFor(n);
    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: { title: i18n.t(n.titleKey), data: { category: n.category, ...(n.slot ? { slot: n.slot } : {}) } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.fireAt },
      });
    } catch (e) {
      await cancelOwn(added).catch(() => undefined);
      throw new Error(`Could not schedule ${identifier}: ${e instanceof Error ? e.message : String(e)}`);
    }
    added.push(identifier);
  }
}
