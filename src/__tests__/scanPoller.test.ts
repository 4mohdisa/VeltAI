// startScanPoller — polls a scan log until ready/failed. Fake timers drive the
// 3s poll interval and 60s deadline; api.foodLogs.get is mocked.
/* eslint-disable import/first -- jest.mock must be hoisted above the imports it replaces */
jest.mock('@/lib/api', () => ({ api: { foodLogs: { get: jest.fn() } } }));

import { api } from '@/lib/api';
import { startScanPoller } from '@/lib/data/scanPoller';

const getMock = api.foodLogs.get as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  getMock.mockReset();
});
afterEach(() => {
  jest.useRealTimers();
});

test('calls onReady when status becomes ready', async () => {
  getMock.mockResolvedValue({ id: '1', status: 'ready' });
  const onReady = jest.fn();
  const onFailed = jest.fn();
  startScanPoller('1', onReady, onFailed);
  await jest.advanceTimersByTimeAsync(3000);
  expect(onReady).toHaveBeenCalledTimes(1);
  expect(onFailed).not.toHaveBeenCalled();
});

test('calls onFailed when status is failed', async () => {
  getMock.mockResolvedValue({ id: '1', status: 'failed' });
  const onReady = jest.fn();
  const onFailed = jest.fn();
  startScanPoller('1', onReady, onFailed);
  await jest.advanceTimersByTimeAsync(3000);
  expect(onFailed).toHaveBeenCalledTimes(1);
  expect(onReady).not.toHaveBeenCalled();
});

// REWRITTEN in the 2026-08-06 audit: this test pinned the OLD 60s deadline —
// half the server's 120s scan budget, so a slow scan showed "failed" and then
// appeared in the log anyway. The deadline is now 130s (above the server's),
// and it runs one final status check before giving up.
test('times out after 130s (above the server budget) → onFailed exactly once', async () => {
  getMock.mockResolvedValue({ id: '1', status: 'analyzing' });
  const onReady = jest.fn();
  const onFailed = jest.fn();
  startScanPoller('1', onReady, onFailed);
  await jest.advanceTimersByTimeAsync(60_000);
  expect(onFailed).not.toHaveBeenCalled(); // the old deadline must NOT fire here
  await jest.advanceTimersByTimeAsync(70_000);
  expect(onFailed).toHaveBeenCalledTimes(1);
  expect(onReady).not.toHaveBeenCalled();
});

// The deadline's final check turns "backgrounded through a successful scan"
// into ready instead of a false failure: JS timers suspend in the background,
// so the deadline often fires immediately on resume — after the server
// finished. One last read of the truth prevents the false 'failed'.
test('deadline runs a final check — a scan that finished while backgrounded is ready, not failed', async () => {
  getMock.mockResolvedValue({ id: '1', status: 'analyzing' });
  const onReady = jest.fn();
  const onFailed = jest.fn();
  startScanPoller('1', onReady, onFailed);
  await jest.advanceTimersByTimeAsync(120_000);
  getMock.mockResolvedValue({ id: '1', status: 'ready' }); // server finished late
  await jest.advanceTimersByTimeAsync(10_000);
  expect(onReady).toHaveBeenCalledTimes(1);
  expect(onFailed).not.toHaveBeenCalled();
});

test('stop() cancels the in-flight poll — no callbacks, no fetch', async () => {
  getMock.mockResolvedValue({ id: '1', status: 'ready' });
  const onReady = jest.fn();
  const onFailed = jest.fn();
  const stop = startScanPoller('1', onReady, onFailed);
  stop();
  await jest.advanceTimersByTimeAsync(65_000);
  expect(getMock).not.toHaveBeenCalled();
  expect(onReady).not.toHaveBeenCalled();
  expect(onFailed).not.toHaveBeenCalled();
});

test('a transient fetch error keeps polling until success', async () => {
  getMock.mockRejectedValueOnce(new Error('network')).mockResolvedValue({ id: '1', status: 'ready' });
  const onReady = jest.fn();
  const onFailed = jest.fn();
  startScanPoller('1', onReady, onFailed);
  await jest.advanceTimersByTimeAsync(3000); // poll 1 rejects, reschedules
  expect(onReady).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(3000); // poll 2 resolves ready
  expect(onReady).toHaveBeenCalledTimes(1);
});

test('keeps polling while analyzing, then resolves ready', async () => {
  getMock
    .mockResolvedValueOnce({ id: '1', status: 'analyzing' })
    .mockResolvedValueOnce({ id: '1', status: 'analyzing' })
    .mockResolvedValue({ id: '1', status: 'ready' });
  const onReady = jest.fn();
  startScanPoller('1', onReady, jest.fn());
  await jest.advanceTimersByTimeAsync(9000); // three polls
  expect(onReady).toHaveBeenCalledTimes(1);
});
