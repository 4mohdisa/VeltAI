// The gym session sequence (create → add exercises → complete) queued offline as
// ONE ordered unit: it survives a restart, resumes at the right step after a
// partial failure, and can never create a second session. fetch is mocked;
// secure-store is the in-memory jest mock (moduleNameMapper).
import { flush, loadQueue, pendingCount, runOrQueueSequence, __resetForTests, __resetMemoryForTests } from '@/lib/offline/queue';
import { logGymSession } from '@/lib/data/mutations';
import { useGymStore } from '@/lib/data/gymStore';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

type Call = [string, RequestInit?];
const calls = () => (globalThis as unknown as { fetch: jest.Mock }).fetch.mock.calls as Call[];
const paths = () => calls().map(([url]) => url.replace('http://localhost:8080', ''));
const keys = () => calls().map(([, init]) => (init?.headers as Record<string, string>)['Idempotency-Key']);

function setFetch(fn: jest.Mock) {
  (globalThis as unknown as { fetch: unknown }).fetch = fn;
  return fn;
}
const offline = () => setFetch(jest.fn(() => Promise.reject(new TypeError('Network request failed'))));
// Every POST answers with a row id; the session create returns 'sess-1'.
const online = () =>
  setFetch(jest.fn(() => Promise.resolve({ ok: true, status: 201, json: async () => ({ data: { id: 'sess-1' }, error: null }) })));

const EXERCISES = [
  { name: 'Bench press', sets: 3, reps: 8 },
  { name: 'Squat', sets: 5, reps: 5 },
];

const logWorkout = () =>
  logGymSession({ durationMin: 45, notes: 'good one' }, { name: 'Push day', exercises: EXERCISES, completionRate: 1 });

beforeEach(async () => {
  await __resetForTests();
  useGymStore.getState().reset();
  useGymStore.setState((s) => ({ streak: { ...s.streak, gymLoggedToday: false } }));
});
afterEach(() => jest.restoreAllMocks());

test('offline → restart → reconnect: the whole sequence replays exactly once, in order', async () => {
  const off = offline();
  logWorkout();
  await new Promise((r) => setImmediate(r)); // let the fire-and-forget write settle

  // Nothing landed: only the create was attempted (and failed) — no exercise or
  // complete POST goes out before the session exists.
  expect(paths()).toEqual(['/api/gym/sessions']);
  expect(off).toHaveBeenCalledTimes(1);
  expect(pendingCount()).toBe(1); // one unit, not three entries
  // The local store still shows the workout (offline-first).
  expect(useGymStore.getState().streak.gymLoggedToday).toBe(true);

  // Restart: in-memory state dropped, the unit rehydrates from secure-store.
  __resetMemoryForTests();
  expect(pendingCount()).toBe(0);
  await loadQueue();
  expect(pendingCount()).toBe(1);

  online();
  expect(await flush()).toEqual({ flushed: 1, remaining: 0 });

  // Exactly one create; both exercises against the id the create returned;
  // complete last.
  expect(paths()).toEqual([
    '/api/gym/sessions',
    '/api/gym/sessions/sess-1/exercises',
    '/api/gym/sessions/sess-1/exercises',
    '/api/gym/sessions/sess-1/complete',
  ]);
  expect(JSON.parse(calls()[1][1]!.body as string)).toEqual(EXERCISES[0]);
  expect(JSON.parse(calls()[2][1]!.body as string)).toEqual(EXERCISES[1]);
  expect(JSON.parse(calls()[3][1]!.body as string)).toEqual({ completion_rate: 1 });
  // One shared idempotency key for the unit.
  expect(new Set(keys()).size).toBe(1);

  // A second flush is a no-op — the queue is drained, no duplicate session.
  const again = online();
  expect(await flush()).toEqual({ flushed: 0, remaining: 0 });
  expect(again).not.toHaveBeenCalled();
});

test('a partial failure resumes at the right step and never re-creates the session', async () => {
  // Create succeeds, the first exercise POST dies on the network.
  let n = 0;
  setFetch(
    jest.fn(() =>
      n++ === 0
        ? Promise.resolve({ ok: true, status: 201, json: async () => ({ data: { id: 'sess-1' }, error: null }) })
        : Promise.reject(new TypeError('Network request failed')),
    ),
  );
  await runOrQueueSequence('/api/gym/sessions', { date: '2026-07-28' }, [
    { path: '/api/gym/sessions/{id}/exercises', body: EXERCISES[0] },
    { path: '/api/gym/sessions/{id}/complete', body: { completion_rate: 1 } },
  ]);
  expect(paths()).toEqual(['/api/gym/sessions', '/api/gym/sessions/sess-1/exercises']);
  expect(pendingCount()).toBe(1);

  online();
  await flush();
  // Resumes at the failed exercise — no second create.
  expect(paths()).toEqual(['/api/gym/sessions/sess-1/exercises', '/api/gym/sessions/sess-1/complete']);
  expect(pendingCount()).toBe(0);
});

test('two concurrent flushes run the unit once', async () => {
  offline();
  await runOrQueueSequence('/api/gym/sessions', { date: '2026-07-28' }, [
    { path: '/api/gym/sessions/{id}/complete', body: {} },
  ]);
  expect(pendingCount()).toBe(1);

  const fetchFn = online();
  const [a, b] = await Promise.all([flush(), flush()]);
  expect(paths()).toEqual(['/api/gym/sessions', '/api/gym/sessions/sess-1/complete']);
  expect(a).toEqual({ flushed: 1, remaining: 0 });
  expect(b).toEqual(a);
  expect(fetchFn).toHaveBeenCalledTimes(2);
});
