// Row 10c · The device's push token is registered after a grant, survives a
// relaunch in secure storage, and is removed at sign-out (resetAllStores).
// expo-notifications and the API client are mocked; secure storage is the
// in-memory mock. A failed request is dropped and never blocks sign-out.
import * as Notifications from 'expo-notifications';

import { api } from '@/lib/api';
import { resetAllStores } from '@/lib/auth/resetRegistry';
import { registerPushToken, removePushToken } from '@/lib/notifications/pushToken';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { __reset as resetSecureStore } from './mocks/expoSecureStore';

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

const INPUT = { token: 'device-token', platform: 'ios' as const };
const N = jest.mocked(Notifications);
const register = jest.mocked(api.push.register);
const remove = jest.mocked(api.push.remove);

const permission = (status: 'granted' | 'denied') =>
  N.getPermissionsAsync.mockResolvedValue({ status } as Notifications.NotificationPermissionsStatus);

const shared = {
  api: jest.requireMock('@/lib/api'),
  notifications: jest.requireMock('expo-notifications'),
  secureStore: jest.requireActual('@/lib/storage/secureStore'),
};
/** A fresh copy of pushToken.ts, as after an app relaunch: memory empty, the same storage. */
const relaunch = () => {
  let mod!: typeof import('@/lib/notifications/pushToken');
  jest.isolateModules(() => {
    jest.doMock('@/lib/api', () => shared.api);
    jest.doMock('expo-notifications', () => shared.notifications);
    jest.doMock('@/lib/storage/secureStore', () => shared.secureStore);
    mod = jest.requireActual('@/lib/notifications/pushToken');
  });
  return mod;
};
const stored = async () => getItem(STORAGE_KEYS.pushToken);

/** Sign-out, plus the push token request it starts without awaiting. */
async function signOut() {
  await resetAllStores();
  await new Promise((r) => setImmediate(r));
}

beforeEach(async () => {
  remove.mockResolvedValue(undefined);
  await removePushToken(); // forget a token a previous test kept in memory
  jest.clearAllMocks();
  resetSecureStore();
  permission('granted');
  N.getDevicePushTokenAsync.mockResolvedValue({ type: 'ios', data: INPUT.token });
  register.mockResolvedValue(undefined); // the client resolves a 204 to undefined
  remove.mockResolvedValue(undefined);
});

test('a grant registers the token once with its platform, without a prompt, and saves it after the 204', async () => {
  await relaunch().registerPushToken();
  expect(register).toHaveBeenCalledTimes(1);
  expect(register).toHaveBeenCalledWith(INPUT);
  expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(JSON.parse((await stored()) ?? 'null')).toEqual(INPUT);
});

test('without permission no token is read, there is no call and nothing is saved', async () => {
  permission('denied');
  const mod = relaunch();
  await mod.registerPushToken();
  await mod.restorePushToken();
  expect(N.getDevicePushTokenAsync).not.toHaveBeenCalled();
  expect(register).not.toHaveBeenCalled();
  expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(await stored()).toBeNull();
});

test('a token on another platform is not registered', async () => {
  N.getDevicePushTokenAsync.mockResolvedValue({ type: 'web', data: {} } as Notifications.DevicePushToken);
  await registerPushToken();
  expect(register).not.toHaveBeenCalled();
});

test('a failed register saves nothing, so sign-out sends no DELETE', async () => {
  register.mockRejectedValue(new Error('402'));
  await expect(registerPushToken()).resolves.toBeUndefined();
  expect(await stored()).toBeNull();
  await signOut();
  expect(remove).not.toHaveBeenCalled();
});

test('after a relaunch, restore sends the stored token when the device gives none', async () => {
  await setItem(STORAGE_KEYS.pushToken, JSON.stringify(INPUT));
  N.getDevicePushTokenAsync.mockRejectedValue(new Error('no token'));
  const mod = relaunch();
  await mod.restorePushToken();
  await mod.restorePushToken();
  expect(register).toHaveBeenCalledTimes(1);
  expect(register).toHaveBeenCalledWith(INPUT);
});

test('sign-out with a registered token sends DELETE once and forgets the token', async () => {
  await registerPushToken();
  await signOut();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledWith(INPUT.token);
  await signOut();
  expect(remove).toHaveBeenCalledTimes(1);
});

test('sign-out without a registered token makes no request', async () => {
  await signOut();
  expect(remove).not.toHaveBeenCalled();
});

test('after a relaunch, sign-out removes the stored token and clears it', async () => {
  await setItem(STORAGE_KEYS.pushToken, JSON.stringify(INPUT));
  await relaunch().removePushToken();
  expect(remove).toHaveBeenCalledWith(INPUT.token);
  expect(await stored()).toBeNull();
});

test('a failed DELETE keeps the stored token for the next try', async () => {
  await setItem(STORAGE_KEYS.pushToken, JSON.stringify(INPUT));
  remove.mockRejectedValue(new Error('offline'));
  await expect(relaunch().removePushToken()).resolves.toBeUndefined();
  expect(JSON.parse((await stored()) ?? 'null')).toEqual(INPUT);
});

test('sign-out does not wait on the DELETE, and a failing one still completes it', async () => {
  await setItem(STORAGE_KEYS.pushToken, JSON.stringify(INPUT));
  remove.mockReturnValue(new Promise(() => undefined));
  await expect(resetAllStores()).resolves.toBeUndefined();
  await new Promise((r) => setImmediate(r));
  expect(remove).toHaveBeenCalledWith(INPUT.token);

  remove.mockRejectedValue(new Error('500'));
  await setItem(STORAGE_KEYS.notificationDayKey, '2026-11-27');
  await expect(signOut()).resolves.toBeUndefined();
  expect(remove).toHaveBeenCalledTimes(2);
  expect(await getItem(STORAGE_KEYS.notificationDayKey)).toBeNull();
});
