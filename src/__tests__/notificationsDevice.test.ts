// Row 10: src/lib/notifications/device.ts against a mocked expo-notifications.
// Permission is read without prompting, and a reschedule replaces only Lume's
// own notifications (identifier prefix), with rollback when a schedule fails.
import * as Notifications from 'expo-notifications';

import { applySchedule, clearReminders, notificationPermission, REMINDER_PREFIX } from '@/lib/notifications/device';
import type { ScheduledNotification } from '@/lib/notifications/types';
import en from '@/lib/i18n/locales/en.json';

jest.mock('expo-notifications', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

const N = jest.mocked(Notifications);
const FOREIGN = 'other-app-alarm';
const OLD_OWN = `${REMINDER_PREFIX}workout_reminder.all.1`;

const MEAL: ScheduledNotification = {
  category: 'meal_reminder',
  fireAt: new Date('2026-11-28T07:00:00Z'),
  titleKey: 'notifications.meal_reminder.title',
  slot: 'Breakfast',
};
const STREAK: ScheduledNotification = {
  category: 'streak_at_risk',
  fireAt: new Date('2026-11-28T09:00:00Z'),
  titleKey: 'notifications.streak_at_risk.title',
};

const scheduledIds = () => N.scheduleNotificationAsync.mock.calls.map(([req]) => req.identifier);

beforeEach(() => {
  jest.clearAllMocks();
  N.getAllScheduledNotificationsAsync.mockResolvedValue([
    { identifier: FOREIGN },
    { identifier: OLD_OWN },
  ] as Notifications.NotificationRequest[]);
  N.cancelScheduledNotificationAsync.mockResolvedValue();
  N.scheduleNotificationAsync.mockImplementation(async (req) => req.identifier ?? '');
});

describe('notificationPermission', () => {
  test.each([
    ['granted', true],
    ['denied', false],
    ['undetermined', false],
  ])('status %s returns %s and never prompts', async (status, want) => {
    N.getPermissionsAsync.mockResolvedValue({ status } as Notifications.NotificationPermissionsStatus);
    await expect(notificationPermission()).resolves.toBe(want);
    expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test('a failing read counts as not granted', async () => {
    N.getPermissionsAsync.mockRejectedValue(new Error('native module missing'));
    await expect(notificationPermission()).resolves.toBe(false);
  });
});

describe('applySchedule', () => {
  test("cancels only Lume's own notifications and leaves others", async () => {
    await applySchedule([MEAL]);
    expect(N.cancelScheduledNotificationAsync.mock.calls).toEqual([[OLD_OWN]]);
  });

  test('schedules every item once with a date trigger and its title', async () => {
    await applySchedule([MEAL, STREAK]);
    expect(N.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(N.scheduleNotificationAsync).toHaveBeenNthCalledWith(1, {
      identifier: `${REMINDER_PREFIX}meal_reminder.Breakfast.${MEAL.fireAt.getTime()}`,
      content: { title: en.notifications.meal_reminder.title, data: { category: 'meal_reminder', slot: 'Breakfast' } },
      trigger: { type: 'date', date: MEAL.fireAt },
    });
    expect(N.scheduleNotificationAsync).toHaveBeenNthCalledWith(2, {
      identifier: `${REMINDER_PREFIX}streak_at_risk.all.${STREAK.fireAt.getTime()}`,
      content: { title: en.notifications.streak_at_risk.title, data: { category: 'streak_at_risk' } },
      trigger: { type: 'date', date: STREAK.fireAt },
    });
    expect(new Set(scheduledIds()).size).toBe(2);
  });

  test('an empty list cancels the old ones and schedules nothing', async () => {
    await applySchedule([]);
    expect(N.cancelScheduledNotificationAsync.mock.calls).toEqual([[OLD_OWN]]);
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('a failed schedule rejects clearly and cancels what this call already scheduled', async () => {
    N.scheduleNotificationAsync
      .mockImplementationOnce(async (req) => req.identifier ?? '')
      .mockRejectedValueOnce(new Error('quota reached'));
    const firstId = `${REMINDER_PREFIX}meal_reminder.Breakfast.${MEAL.fireAt.getTime()}`;

    await expect(applySchedule([MEAL, STREAK])).rejects.toThrow(
      `Could not schedule ${REMINDER_PREFIX}streak_at_risk.all.${STREAK.fireAt.getTime()}: quota reached`,
    );
    expect(N.cancelScheduledNotificationAsync.mock.calls).toEqual([[OLD_OWN], [firstId]]);
  });
});

describe('clearReminders', () => {
  test('cancels every Lume reminder and leaves other notifications alone', async () => {
    const otherOwn = `${REMINDER_PREFIX}meal_reminder.Breakfast.2`;
    N.getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: FOREIGN },
      { identifier: OLD_OWN },
      { identifier: otherOwn },
    ] as Notifications.NotificationRequest[]);
    await clearReminders();
    expect(N.cancelScheduledNotificationAsync.mock.calls).toEqual([[OLD_OWN], [otherOwn]]);
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('with nothing of Lume scheduled, cancels nothing', async () => {
    N.getAllScheduledNotificationsAsync.mockResolvedValue([{ identifier: FOREIGN }] as Notifications.NotificationRequest[]);
    await clearReminders();
    expect(N.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });
});
