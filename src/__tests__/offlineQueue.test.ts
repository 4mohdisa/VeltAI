// Offline mutation queue — queue on network failure, flush on reconnect in order,
// dedupe via idempotency key, survive a restart. fetch is mocked; secure-store is
// the in-memory jest mock (moduleNameMapper).
import { ApiError } from '@/lib/api';
import {
  runOrQueue,
  flush,
  enqueue,
  loadQueue,
  pendingCount,
  subscribe,
  __resetForTests,
  __resetMemoryForTests,
} from '@/lib/offline/queue';

// fetch mock modes. Typed to accept (url, init) so mock.calls are inspectable.
function offline() {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((_url: string, _init?: RequestInit) =>
    Promise.reject(new TypeError('Network request failed')),
  );
}
function online() {
  const fn = jest.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve({ ok: true, status: 201, json: async () => ({ data: { id: 'srv-1' }, error: null }) }),
  );
  (globalThis as unknown as { fetch: unknown }).fetch = fn;
  return fn;
}
function serverError() {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve({ ok: false, status: 400, json: async () => ({ data: null, error: 'bad' }) }),
  );
}

beforeEach(async () => {
  await __resetForTests();
});
afterEach(() => jest.restoreAllMocks());

test('runOrQueue queues on a network failure and resolves null', async () => {
  offline();
  const res = await runOrQueue('/api/food/logs', { food_name: 'Rice', calories: 200 });
  expect(res).toBeNull();
  expect(pendingCount()).toBe(1);
});

test('runOrQueue re-throws a server error (permanent) and does NOT queue', async () => {
  serverError();
  await expect(runOrQueue('/api/food/logs', { calories: -1 })).rejects.toBeInstanceOf(ApiError);
  expect(pendingCount()).toBe(0);
});

test('flush replays queued writes in order and drains the queue', async () => {
  offline();
  await runOrQueue('/api/food/logs', { food_name: 'A' });
  await runOrQueue('/api/gym/sessions', { date: '2026-07-18' });
  expect(pendingCount()).toBe(2);

  const fetchFn = online();
  const res = await flush();
  expect(res).toEqual({ flushed: 2, remaining: 0 });
  expect(pendingCount()).toBe(0);
  // Order preserved: food first, gym second.
  expect((fetchFn.mock.calls[0][0] as string)).toContain('/api/food/logs');
  expect((fetchFn.mock.calls[1][0] as string)).toContain('/api/gym/sessions');
});

test('each replay carries a stable idempotency key (no duplicates)', async () => {
  offline();
  const m = await enqueue('/api/food/logs', { food_name: 'A' });
  const fetchFn = online();
  await flush();
  const init = fetchFn.mock.calls[0][1] as RequestInit;
  expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe(m.idempotencyKey);
  // A second flush sends nothing (queue already drained → no duplicate write).
  const fetch2 = online();
  await flush();
  expect(fetch2).not.toHaveBeenCalled();
});

test('the queue survives a restart (persisted to secure-store)', async () => {
  offline();
  await runOrQueue('/api/food/logs', { food_name: 'A' });
  expect(pendingCount()).toBe(1);

  // Simulate an app restart: drop in-memory state, then rehydrate from storage.
  __resetMemoryForTests();
  expect(pendingCount()).toBe(0); // not yet loaded
  await loadQueue();
  expect(pendingCount()).toBe(1); // restored from secure-store

  const fetchFn = online();
  await flush();
  expect(fetchFn).toHaveBeenCalledTimes(1);
  expect(pendingCount()).toBe(0);
});

test('flush stops on the first error, preserving the queue', async () => {
  offline();
  await runOrQueue('/api/food/logs', { food_name: 'A' });
  await runOrQueue('/api/food/logs', { food_name: 'B' });
  // Still offline → flush drains nothing.
  const res = await flush();
  expect(res.flushed).toBe(0);
  expect(pendingCount()).toBe(2);
});

// Audit 2026-08-06: a PERMANENTLY-failing mutation at the head used to block
// the queue forever (flush broke on ANY error with no poison handling), so one
// rejected write silently froze all offline sync for the rest of time.
test('flush drops a permanently-rejected mutation instead of blocking the queue', async () => {
  offline();
  await runOrQueue('/api/food/logs', { food_name: 'Poison' });
  await runOrQueue('/api/gym/sessions', { date: '2026-07-18' });
  expect(pendingCount()).toBe(2);

  // First path 400s forever; everything else succeeds.
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string, _init?: RequestInit) =>
    String(url).includes('/api/food/logs')
      ? Promise.resolve({ ok: false, status: 400, json: async () => ({ data: null, error: 'bad' }) })
      : Promise.resolve({ ok: true, status: 201, json: async () => ({ data: { id: 'srv-2' }, error: null }) }),
  );
  const res = await flush();
  expect(res.flushed).toBe(1); // the healthy write behind the poison landed
  expect(res.remaining).toBe(0); // and the poison is gone, not parked forever
});

test('subscribe fires with the current count and on change', async () => {
  const counts: number[] = [];
  const unsub = subscribe((c) => counts.push(c));
  offline();
  await runOrQueue('/api/food/logs', { food_name: 'A' });
  unsub();
  expect(counts[0]).toBe(0); // immediate
  expect(counts[counts.length - 1]).toBe(1); // after enqueue
});
