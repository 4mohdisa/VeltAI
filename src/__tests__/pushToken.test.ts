// Row 10c · The push token survives a relaunch so sign-out can still remove it.
// device.ts and the API client are mocked; secure storage is the in-memory mock.
import { api } from '@/lib/api';
import { resetAllStores } from '@/lib/auth/resetRegistry';
import { getPushToken, notificationPermission } from '@/lib/notifications/device';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { __reset as resetSecureStore } from './mocks/expoSecureStore';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: { push: { register: jest.fn(), remove: jest.fn() } },
}));
jest.mock('@/lib/notifications/device', () => ({
  notificationPermission: jest.fn(),
  getPushToken: jest.fn(),
  clearReminders: jest.fn(async () => undefined),
}));

const INPUT = { token: 'device-token', platform: 'ios' as const };
const register = jest.mocked(api.push.register);
const remove = jest.mocked(api.push.remove);
const permission = jest.mocked(notificationPermission);
const deviceToken = jest.mocked(getPushToken);

const shared = {
  api: jest.requireMock('@/lib/api'),
  device: jest.requireMock('@/lib/notifications/device'),
  secureStore: jest.requireActual('@/lib/storage/secureStore'),
};
/** A fresh copy of pushToken.ts, as after an app relaunch: memory empty, the same storage. */
const relaunch = () => {
  let mod!: typeof import('@/lib/notifications/pushToken');
  jest.isolateModules(() => {
    jest.doMock('@/lib/api', () => shared.api);
    jest.doMock('@/lib/notifications/device', () => shared.device);
    jest.doMock('@/lib/storage/secureStore', () => shared.secureStore);
    mod = jest.requireActual('@/lib/notifications/pushToken');
  });
  return mod;
};
const stored = async () => getItem(STORAGE_KEYS.pushToken);
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  jest.clearAllMocks();
  resetSecureStore();
  permission.mockResolvedValue(true);
  deviceToken.mockResolvedValue(INPUT);
  register.mockResolvedValue(undefined); // the client resolves a 204 to undefined
  remove.mockResolvedValue(undefined);
});

test('a grant registers the token and saves it after the 204', async () => {
  await relaunch().registerPushToken();
  expect(register).toHaveBeenCalledWith(INPUT);
  expect(JSON.parse((await stored()) ?? 'null')).toEqual(INPUT);
});

test('a failed register saves nothing', async () => {
  register.mockRejectedValue(new Error('402'));
  await relaunch().registerPushToken();
  expect(await stored()).toBeNull();
});

test('without permission there is no call and nothing is saved', async () => {
  permission.mockResolvedValue(false);
  const mod = relaunch();
  await mod.registerPushToken();
  await mod.restorePushToken();
  expect(deviceToken).not.toHaveBeenCalled();
  expect(register).not.toHaveBeenCalled();
});

test('after a relaunch, restore sends the stored token when the device gives none', async () => {
  await setItem(STORAGE_KEYS.pushToken, JSON.stringify(INPUT));
  deviceToken.mockResolvedValue(null);
  const mod = relaunch();
  await mod.restorePushToken();
  await mod.restorePushToken();
  expect(register).toHaveBeenCalledTimes(1);
  expect(register).toHaveBeenCalledWith(INPUT);
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

test('sign-out does not wait on the DELETE, and a failing one never blocks it', async () => {
  await setItem(STORAGE_KEYS.pushToken, JSON.stringify(INPUT));
  remove.mockReturnValue(new Promise(() => undefined));
  await expect(resetAllStores()).resolves.toBeUndefined();
  await flush();
  expect(remove).toHaveBeenCalledWith(INPUT.token);

  remove.mockRejectedValue(new Error('500'));
  await expect(resetAllStores()).resolves.toBeUndefined();
});
