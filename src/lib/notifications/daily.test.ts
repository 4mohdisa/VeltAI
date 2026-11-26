// Row 10: ensureDailySchedule reschedules once per local day in the given zone,
// and never schedules without permission. device.ts is mocked; the clock is fake.
import { ensureDailySchedule } from './daily';
import { applySchedule, notificationPermission } from './device';
import { DEFAULT_NOTIFICATION_SETTINGS } from './types';

jest.mock('./device', () => ({
  notificationPermission: jest.fn(),
  applySchedule: jest.fn(async () => undefined),
}));

const permission = jest.mocked(notificationPermission);
const schedule = jest.mocked(applySchedule);

const run = (iso: string, timeZone: string, lastDayKey: string | null) => {
  jest.setSystemTime(new Date(iso));
  return ensureDailySchedule({
    now: new Date(),
    timeZone,
    settings: DEFAULT_NOTIFICATION_SETTINGS,
    mealLogTimes: {},
    lastDayKey,
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  permission.mockResolvedValue(true);
});

afterEach(() => jest.useRealTimers());

test('the same local day twice schedules once', async () => {
  const first = await run('2026-11-27T09:00:00Z', 'UTC', null);
  const second = await run('2026-11-27T21:00:00Z', 'UTC', first);
  expect([first, second]).toEqual(['2026-11-27', '2026-11-27']);
  expect(schedule).toHaveBeenCalledTimes(1);
});

test('a new local day schedules again', async () => {
  const first = await run('2026-11-27T23:00:00Z', 'UTC', null);
  const next = await run('2026-11-28T00:30:00Z', 'UTC', first);
  expect(next).toBe('2026-11-28');
  expect(schedule).toHaveBeenCalledTimes(2);
});

test('a zone ahead of UTC is already on the next day', async () => {
  // 14:00 UTC on 27 Nov is 00:30 on 28 Nov in Adelaide (UTC+10:30 in summer).
  const key = await run('2026-11-27T14:00:00Z', 'Australia/Adelaide', '2026-11-27');
  expect(key).toBe('2026-11-28');
  expect(schedule).toHaveBeenCalledTimes(1);
});

test('a zone behind UTC is still on the previous day', async () => {
  // 03:00 UTC on 28 Nov is 22:00 on 27 Nov in New York (UTC-5).
  const key = await run('2026-11-28T03:00:00Z', 'America/New_York', '2026-11-27');
  expect(key).toBe('2026-11-27');
  expect(schedule).not.toHaveBeenCalled();
});

test('without permission the new key is returned and nothing is scheduled', async () => {
  permission.mockResolvedValue(false);
  const key = await run('2026-11-27T09:00:00Z', 'UTC', '2026-11-26');
  expect(key).toBe('2026-11-27');
  expect(permission).toHaveBeenCalledTimes(1);
  expect(schedule).not.toHaveBeenCalled();
});
