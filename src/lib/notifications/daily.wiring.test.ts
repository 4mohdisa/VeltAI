// Row 10: startDailySchedule, the root layout's one reminders call. It runs at
// app start and when the app becomes active, schedules at most once per local
// day, keeps the day key in secure storage (cleared on sign-out), retries after
// a failed schedule, never asks for permission and plans meal reminders from
// the week's food logs. Fake clock, mocked AppState, device.ts,
// expo-notifications and the food log read; secure storage is the in-memory mock.
import { AppState } from 'react-native';

import type { FoodLog } from '@/lib/api';
import { resetAllStores } from '@/lib/auth/resetRegistry';
import { fetchWeekLogs } from '@/lib/data/hooks';
import { getItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { runDailySchedule, startDailySchedule } from './daily';
import { applySchedule, notificationPermission } from './device';

type Listener = (state: string) => void;
const mockListeners: Listener[] = [];

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn((_event: string, listener: Listener) => {
      mockListeners.push(listener);
      return { remove: () => mockListeners.splice(mockListeners.indexOf(listener), 1) };
    }),
  },
}));
jest.mock('expo-notifications', () => ({ requestPermissionsAsync: jest.fn() }));
jest.mock('./device', () => ({
  notificationPermission: jest.fn(),
  applySchedule: jest.fn(async () => undefined),
  clearReminders: jest.fn(async () => undefined),
}));
jest.mock('@/lib/api', () => ({ deviceTimeZone: () => 'UTC' }));
jest.mock('@/lib/data/hooks', () => ({ fetchWeekLogs: jest.fn(async () => []) }));

const permission = jest.mocked(notificationPermission);
const schedule = jest.mocked(applySchedule);
const weekLogs = jest.mocked(fetchWeekLogs);
const { requestPermissionsAsync } = jest.requireMock<{ requestPermissionsAsync: jest.Mock }>('expo-notifications');
const savedKey = () => getItem(STORAGE_KEYS.notificationDayKey);

let stop: () => void = () => undefined;

async function start(iso: string) {
  jest.setSystemTime(new Date(iso));
  stop = startDailySchedule();
  await runDailySchedule(); // joins the run startDailySchedule began
}

async function foreground(iso: string) {
  jest.setSystemTime(new Date(iso));
  mockListeners.forEach((l) => l('active'));
  await runDailySchedule();
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  permission.mockResolvedValue(true);
  await resetAllStores();
});

afterEach(() => {
  stop();
  jest.useRealTimers();
});

test('app start schedules once and saves the day key', async () => {
  await start('2026-11-27T09:00:00Z');
  expect(schedule).toHaveBeenCalledTimes(1);
  expect(await savedKey()).toBe('2026-11-27');
  expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
});

test('a second foreground on the same day does nothing', async () => {
  await start('2026-11-27T09:00:00Z');
  await foreground('2026-11-27T18:00:00Z');
  expect(schedule).toHaveBeenCalledTimes(1);
});

test('a foreground on a new day reschedules', async () => {
  await start('2026-11-27T09:00:00Z');
  await foreground('2026-11-28T08:00:00Z');
  expect(schedule).toHaveBeenCalledTimes(2);
  expect(await savedKey()).toBe('2026-11-28');
});

test('sign-out clears the key, so the next account reschedules the same day', async () => {
  await start('2026-11-27T09:00:00Z');
  await resetAllStores();
  expect(await savedKey()).toBeNull();
  await foreground('2026-11-27T10:00:00Z');
  expect(schedule).toHaveBeenCalledTimes(2);
});

test('a failed schedule leaves the key unset, so the next call retries', async () => {
  schedule.mockRejectedValueOnce(new Error('no slot'));
  await start('2026-11-27T09:00:00Z');
  expect(await savedKey()).toBeNull();
  await foreground('2026-11-27T09:05:00Z');
  expect(schedule).toHaveBeenCalledTimes(2);
  expect(await savedKey()).toBe('2026-11-27');
});

test('without permission nothing is scheduled and nothing prompts', async () => {
  permission.mockResolvedValue(false);
  await start('2026-11-27T09:00:00Z');
  await foreground('2026-11-27T18:00:00Z');
  expect(schedule).not.toHaveBeenCalled();
  expect(requestPermissionsAsync).not.toHaveBeenCalled();
});

test('the week\'s logged meals set the meal reminder time', async () => {
  const breakfast = (day: number) =>
    ({ date: `2026-11-2${day}`, meal_type: 'Breakfast', created_at: `2026-11-2${day}T07:45:00Z` }) as FoodLog;
  weekLogs.mockResolvedValueOnce([[breakfast(4)], [breakfast(5)], [breakfast(6)]]);
  await start('2026-11-27T00:30:00Z');
  const first = schedule.mock.calls[0][0].find((n) => n.slot === 'Breakfast');
  expect(first?.fireAt.toISOString()).toBe('2026-11-27T07:45:00.000Z');
});

test('a failed food log read still schedules, at the default meal times', async () => {
  weekLogs.mockRejectedValueOnce(new Error('offline'));
  await start('2026-11-27T00:30:00Z');
  const first = schedule.mock.calls[0][0].find((n) => n.slot === 'Breakfast');
  expect(first?.fireAt.toISOString()).toBe('2026-11-27T08:00:00.000Z');
  expect(await savedKey()).toBe('2026-11-27');
});
