// Row 10: startDailySchedule, the root layout's one reminders call. It runs at
// app start and when the app becomes active, schedules at most once per local
// day, keeps the day key in secure storage (cleared on sign-out), retries after
// a failed schedule and never asks for permission. Fake clock, mocked AppState,
// device.ts and expo-notifications; secure storage is the in-memory test mock.
import { AppState } from 'react-native';

import { resetAllStores } from '@/lib/auth/resetRegistry';
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
}));
jest.mock('@/lib/api', () => ({ deviceTimeZone: () => 'UTC' }));

const permission = jest.mocked(notificationPermission);
const schedule = jest.mocked(applySchedule);
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
