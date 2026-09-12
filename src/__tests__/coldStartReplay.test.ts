// Why a gym session can POST itself "out of nowhere" on a cold start.
//
// The structural pass saw one POST /api/gym/sessions (today, 60 min) at a first
// simulator launch, with no user action behind it, and could not explain it. It
// is the offline queue working exactly as designed: a log whose POST failed is
// persisted to secure-store with its body intact, and _layout.tsx flushes the
// queue on EVERY launch and foreground. The replay therefore arrives on the next
// cold start, carrying the date and duration captured when it was first logged —
// which reads as a phantom if you never saw the original failure.
//
// This pins the three facts that make it explainable rather than spooky:
//   1. a failed log is queued, not lost;
//   2. the replay is verbatim — it is NEVER re-dated to the day it replays on;
//   3. once flushed the queue is empty, so it does not recur.
//
// fetch is mocked; secure-store is the in-memory jest mock (moduleNameMapper).
import { flush, loadQueue, pendingCount, __resetForTests, __resetMemoryForTests } from '@/lib/offline/queue';
import { logGymSession } from '@/lib/data/mutations';
import { useGymStore } from '@/lib/data/gymStore';
import { todayISO } from '@/lib/data/mappers';
import { setItem } from '@/lib/storage/secureStore';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const STORAGE_KEY = 'lume.offline.queue';
type Call = [string, RequestInit?];
const calls = () => (globalThis as unknown as { fetch: jest.Mock }).fetch.mock.calls as Call[];
const posts = () =>
  calls()
    .filter(([, init]) => init?.method === 'POST')
    .map(([url, init]) => ({ path: url.replace('http://localhost:8080', ''), body: JSON.parse(String(init?.body ?? '{}')) }));

const setFetch = (fn: jest.Mock) => {
  (globalThis as unknown as { fetch: unknown }).fetch = fn;
  return fn;
};
const offline = () => setFetch(jest.fn(() => Promise.reject(new TypeError('Network request failed'))));
const online = () =>
  setFetch(jest.fn(() => Promise.resolve({ ok: true, status: 201, json: async () => ({ data: { id: 'sess-1' }, error: null }) })));
const settle = () => new Promise((r) => setImmediate(r));

beforeEach(async () => {
  await __resetForTests();
  useGymStore.getState().reset();
  useGymStore.setState((s) => ({ streak: { ...s.streak, gymLoggedToday: false } }));
});
afterEach(() => jest.restoreAllMocks());

test('a log whose POST fails is queued, then replays once on the next launch', async () => {
  offline();
  logGymSession({ durationMin: 60 });
  await settle();
  expect(posts()).toHaveLength(1); // attempted
  expect(pendingCount()).toBe(1); // and kept

  // Cold start: memory is gone, the queue rehydrates from secure-store, and
  // _layout's loadQueue().then(flush) runs.
  __resetMemoryForTests();
  online();
  await loadQueue();
  expect(pendingCount()).toBe(1);
  expect(await flush()).toEqual({ flushed: 1, remaining: 0 });

  // Exactly the shape the structural pass could not account for.
  expect(posts()).toEqual([
    { path: '/api/gym/sessions', body: expect.objectContaining({ date: todayISO(), duration_minutes: 60 }) },
  ]);

  // A second cold start posts nothing — which is why it never recurred.
  __resetMemoryForTests();
  await loadQueue();
  expect(await flush()).toEqual({ flushed: 0, remaining: 0 });
});

test('the replay is verbatim: a log queued days ago keeps ITS date, not the replay day', async () => {
  // A unit persisted on 1 September, replayed whenever the app next runs.
  await setItem(
    STORAGE_KEY,
    JSON.stringify([
      {
        id: 'm1',
        idempotencyKey: 'key-1',
        path: '/api/gym/sessions',
        body: { date: '2026-09-01', name: null, duration_minutes: 45, notes: null },
        createdAt: 0,
      },
    ]),
  );
  __resetMemoryForTests();
  online();
  await loadQueue();
  expect(await flush()).toEqual({ flushed: 1, remaining: 0 });

  const [sent] = posts();
  expect(sent.body.date).toBe('2026-09-01');
  expect(sent.body.date).not.toBe(todayISO());
  expect(sent.body.duration_minutes).toBe(45);
});
