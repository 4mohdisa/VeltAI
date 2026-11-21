// runOrQueueSequence's onLanded reconciliation: the gym create path has no id
// reconciliation today (PHASE2_ROWS.md row 9) because this callback did not
// exist. fetch is mocked; secure-store is the in-memory jest mock
// (moduleNameMapper). No network.
import { flush, pendingCount, runOrQueueSequence, __resetForTests } from '@/lib/offline/queue';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

function setFetch(fn: jest.Mock): jest.Mock {
  (globalThis as unknown as { fetch: unknown }).fetch = fn;
  return fn;
}
const jsonOk = (data: unknown, status = 200) => ({ ok: true, status, json: async () => ({ data, error: null }) });
const jsonErr = (status: number, error: string) => ({ ok: false, status, json: async () => ({ data: null, error }) });

beforeEach(async () => {
  await __resetForTests();
});
afterEach(() => jest.restoreAllMocks());

test('on the immediate path, runOrQueueSequence returns the created row', async () => {
  setFetch(jest.fn(async () => jsonOk({ id: 'sess-1' }, 201)));
  const landed = jest.fn();
  const created = await runOrQueueSequence<{ id: string }>('/api/gym/sessions', { date: '2026-11-19' }, [], landed);
  expect(created).toEqual({ id: 'sess-1' });
  expect(landed).not.toHaveBeenCalled(); // not queued — no reconciliation needed
  expect(pendingCount()).toBe(0);
});

test('on the queued path, onLanded fires with the server row once the queued write lands', async () => {
  setFetch(jest.fn(async () => jsonErr(503, 'down')));
  const landed = jest.fn();
  const result = await runOrQueueSequence<{ id: string }>('/api/gym/sessions', { date: '2026-11-19' }, [], landed);
  expect(result).toBeNull();
  expect(pendingCount()).toBe(1);
  expect(landed).not.toHaveBeenCalled();

  setFetch(jest.fn(async () => jsonOk({ id: 'sess-1' }, 201)));
  await flush();
  expect(landed).toHaveBeenCalledWith({ id: 'sess-1' });
  expect(pendingCount()).toBe(0);
});
