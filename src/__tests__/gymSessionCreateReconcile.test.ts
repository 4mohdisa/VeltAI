// logGymSession's create path (PHASE2_ROWS.md row 9), mirroring logMeal's
// registerMealCreate: the optimistic local session row swaps to the server id,
// whether the create lands immediately or only after a queued replay. fetch is
// mocked; secure-store is the in-memory jest mock (moduleNameMapper). No network.
import { logGymSession } from '@/lib/data/mutations';
import { useGymStore } from '@/lib/data/gymStore';
import { flush, pendingCount, __resetForTests } from '@/lib/offline/queue';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

function setFetch(fn: jest.Mock): jest.Mock {
  (globalThis as unknown as { fetch: unknown }).fetch = fn;
  return fn;
}
const jsonOk = (data: unknown, status = 200) => ({ ok: true, status, json: async () => ({ data, error: null }) });
const jsonErr = (status: number, error: string) => ({ ok: false, status, json: async () => ({ data: null, error }) });
const tick = () => new Promise((r) => setImmediate(r));
const todaySession = () => useGymStore.getState().sessions.find((s) => s.date === 'Today');

beforeEach(async () => {
  await __resetForTests();
  useGymStore.getState().reset();
  useGymStore.setState((s) => ({ streak: { ...s.streak, gymLoggedToday: false } }));
});
afterEach(() => jest.restoreAllMocks());

test('on the immediate path, the local session row takes the server id right away', async () => {
  setFetch(jest.fn(async () => jsonOk({ id: 'sess-imm' }, 201)));
  logGymSession({ durationMin: 30 });
  await tick();
  expect(todaySession()?.id).toBe('sess-imm');
  expect(pendingCount()).toBe(0);
});

test('on the queued path, the local session row takes the server id once the queue flushes', async () => {
  setFetch(jest.fn(async () => jsonErr(503, 'down')));
  logGymSession({ durationMin: 30 });
  await tick();
  const localId = todaySession()?.id;
  expect(localId).toBeTruthy();
  expect(pendingCount()).toBe(1);

  setFetch(jest.fn(async () => jsonOk({ id: 'sess-queued' }, 201)));
  await flush();
  const sessions = useGymStore.getState().sessions;
  expect(sessions.some((s) => s.id === localId)).toBe(false); // local id is gone
  expect(todaySession()?.id).toBe('sess-queued');
});
