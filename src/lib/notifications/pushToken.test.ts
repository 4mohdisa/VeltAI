// Row 10c: the device's push token is registered after a grant and removed at
// sign-out (resetAllStores). expo-notifications and the API client are mocked;
// a failed request is dropped and never blocks sign-out.
import * as Notifications from 'expo-notifications';

import { api } from '@/lib/api';
import { resetAllStores } from '@/lib/auth/resetRegistry';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { registerPushToken, removePushToken } from './pushToken';

jest.mock('expo-notifications', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelScheduledNotificationAsync: jest.fn(),
}));
jest.mock('@/lib/api', () => {
  const actual = jest.requireActual<typeof import('@/lib/api')>('@/lib/api');
  return { ...actual, api: { ...actual.api, push: { register: jest.fn(), remove: jest.fn() } } };
});

const N = jest.mocked(Notifications);
const register = jest.mocked(api.push.register);
const remove = jest.mocked(api.push.remove);

const permission = (status: 'granted' | 'denied') =>
  N.getPermissionsAsync.mockResolvedValue({ status } as Notifications.NotificationPermissionsStatus);

/** Sign-out, plus the push token request it starts without awaiting. */
async function signOut() {
  await resetAllStores();
  await new Promise((r) => setImmediate(r));
}

beforeEach(async () => {
  await removePushToken(); // forget a token a previous test kept
  jest.clearAllMocks();
  permission('granted');
  N.getDevicePushTokenAsync.mockResolvedValue({ type: 'ios', data: 'device-token-1' });
  register.mockResolvedValue(undefined);
  remove.mockResolvedValue(undefined);
});

test('with permission granted, the token is registered once with its platform', async () => {
  await registerPushToken();
  expect(register).toHaveBeenCalledTimes(1);
  expect(register).toHaveBeenCalledWith({ token: 'device-token-1', platform: 'ios' });
  expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
});

test('with permission denied, no token is read and no request is made', async () => {
  permission('denied');
  await registerPushToken();
  expect(N.getDevicePushTokenAsync).not.toHaveBeenCalled();
  expect(register).not.toHaveBeenCalled();
  expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
});

test('a token on another platform is not registered', async () => {
  N.getDevicePushTokenAsync.mockResolvedValue({ type: 'web', data: {} } as Notifications.DevicePushToken);
  await registerPushToken();
  expect(register).not.toHaveBeenCalled();
});

test('a failed registration keeps no token, so sign-out sends no DELETE', async () => {
  register.mockRejectedValue(new Error('402'));
  await expect(registerPushToken()).resolves.toBeUndefined();
  await signOut();
  expect(remove).not.toHaveBeenCalled();
});

test('sign-out with a registered token sends DELETE once and forgets the token', async () => {
  await registerPushToken();
  await signOut();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledWith('device-token-1');
  await signOut();
  expect(remove).toHaveBeenCalledTimes(1);
});

test('sign-out without a registered token makes no request', async () => {
  await signOut();
  expect(remove).not.toHaveBeenCalled();
});

test('a failed DELETE still completes sign-out', async () => {
  await registerPushToken();
  remove.mockRejectedValue(new Error('offline'));
  await setItem(STORAGE_KEYS.notificationDayKey, '2026-11-27');
  await expect(signOut()).resolves.toBeUndefined();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(await getItem(STORAGE_KEYS.notificationDayKey)).toBeNull();
});
