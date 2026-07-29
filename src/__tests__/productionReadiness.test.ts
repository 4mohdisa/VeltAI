// Production readiness — what breaks against a REAL backend over a REAL network:
// hung connections, 5xx, latency. fetch is mocked; secure-store is the in-memory
// jest mock (moduleNameMapper). No network.
import { ApiError, api, isTransient } from '@/lib/api';
import { hydrateFoodLog } from '@/lib/data/hooks';
import { logMeal } from '@/lib/data/mutations';
import { useFoodStore } from '@/lib/data/foodStore';
import { flush, pendingCount, runOrQueue, __resetForTests, __resetMemoryForTests } from '@/lib/offline/queue';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

function setFetch(fn: jest.Mock): jest.Mock {
  (globalThis as unknown as { fetch: unknown }).fetch = fn;
  return fn;
}
const jsonOk = (data: unknown, status = 200) => ({ ok: true, status, json: async () => ({ data, error: null }) });
const jsonErr = (status: number, error: string) => ({ ok: false, status, json: async () => ({ data: null, error }) });
const tick = () => new Promise((r) => setImmediate(r));

/** Re-import the api module with EXPO_PUBLIC_* overrides applied, so the
 *  env-tunable network knobs can be exercised without waiting 15 real seconds. */
async function withApiEnv<T>(
  env: Record<string, string>,
  fn: (mod: typeof import('@/lib/api')) => Promise<T>,
): Promise<T> {
  const prev: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    prev[k] = process.env[k];
    process.env[k] = env[k];
  }
  jest.resetModules();
  try {
    // require, not import(): jest runs CJS here, and the module must be re-read
    // AFTER the env override (its network knobs are read at module load).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return await fn(require('@/lib/api') as typeof import('@/lib/api'));
  } finally {
    for (const k of Object.keys(env)) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
    jest.resetModules();
  }
}

beforeEach(async () => {
  await __resetForTests();
  useFoodStore.getState().reset();
});
afterEach(() => jest.restoreAllMocks());

// --- 1. Timeouts -------------------------------------------------------------

test('a request that never resolves rejects on the timeout (and aborts the socket)', async () => {
  const seen: RequestInit[] = [];
  setFetch(jest.fn((_url: string, init?: RequestInit) => {
    if (init) seen.push(init);
    return new Promise(() => {}); // hung connection: never settles, never rejects
  }));

  await withApiEnv({ EXPO_PUBLIC_API_TIMEOUT_MS: '40', EXPO_PUBLIC_API_RETRIES: '0' }, async (mod) => {
    await expect(mod.api.goals.get()).rejects.toThrow(/timed out after 40ms/);
  });
  // The underlying request was aborted, not merely abandoned.
  expect((seen[0].signal as AbortSignal).aborted).toBe(true);
});

test('a hung GET is not retried — the deadline is the worst case a user waits', async () => {
  const f = setFetch(jest.fn(() => new Promise(() => {})));
  await withApiEnv({ EXPO_PUBLIC_API_TIMEOUT_MS: '40', EXPO_PUBLIC_API_RETRIES: '2' }, async (mod) => {
    await expect(mod.api.goals.get()).rejects.toThrow(/timed out/);
    // Asserted INSIDE: withApiEnv's trailing jest.resetModules() wipes jest.fn
    // call records (jest 30), so a count read after it always sees 0.
    expect(f).toHaveBeenCalledTimes(1); // not 3 × 40ms — one deadline, then give up
  });
});

test('a timed-out request is transient → queued for replay, never dropped', async () => {
  await withApiEnv({ EXPO_PUBLIC_API_TIMEOUT_MS: '40' }, async (mod) => {
    expect(mod.isTransient(new Error('request timed out after 40ms: POST /api/food/logs'))).toBe(true);
  });
});

test('the scan upload path gets its own, longer bound', async () => {
  setFetch(jest.fn(() => new Promise(() => {})));
  await withApiEnv(
    { EXPO_PUBLIC_API_TIMEOUT_MS: '40', EXPO_PUBLIC_API_UPLOAD_TIMEOUT_MS: '4000', EXPO_PUBLIC_API_RETRIES: '0' },
    async (mod) => {
      const scan = mod.api.scan.pipeline('base64-image-data').then(() => 'settled').catch(() => 'settled');
      const winner = await Promise.race([scan, new Promise((r) => setTimeout(() => r('still-uploading'), 250))]);
      // A megabyte upload is still in flight well past the normal 40ms budget.
      expect(winner).toBe('still-uploading');
      // ...and a normal request on the same client is already dead.
      await expect(mod.api.goals.get()).rejects.toThrow(/timed out after 40ms/);
    },
  );
});

// --- 2. Retries --------------------------------------------------------------

test('a 500 on a GET retries with backoff and then surfaces cleanly', async () => {
  const f = setFetch(jest.fn(async () => jsonErr(500, 'upstream boom')));
  const err = (await api.goals.get().catch((e: unknown) => e)) as ApiError;
  expect(err).toBeInstanceOf(ApiError);
  expect(err.status).toBe(500);
  expect(err.message).toBe('upstream boom'); // readable, not "[object Object]"
  expect(f).toHaveBeenCalledTimes(3); // 1 attempt + 2 retries (default)
}, 15_000);

test('a GET that fails once on the network succeeds on the retry', async () => {
  let n = 0;
  setFetch(jest.fn(async () => {
    if (n++ === 0) throw new TypeError('Network request failed');
    return jsonOk({ calorie_target: 2100 });
  }));
  await expect(api.goals.get()).resolves.toMatchObject({ calorie_target: 2100 });
});

test('a 500 on a POST is NOT retried — one attempt, no duplicate row', async () => {
  const f = setFetch(jest.fn(async () => jsonErr(500, 'boom')));
  await expect(api.foodLogs.create({ food_name: 'Rice', calories: 200 })).rejects.toBeInstanceOf(ApiError);
  expect(f).toHaveBeenCalledTimes(1);
});

test('neither is a PATCH or DELETE', async () => {
  const f = setFetch(jest.fn(async () => jsonErr(503, 'unavailable')));
  await expect(api.foodLogs.update('abc', { calories: 1 })).rejects.toBeInstanceOf(ApiError);
  await expect(api.foodLogs.delete('abc')).rejects.toBeInstanceOf(ApiError);
  expect(f).toHaveBeenCalledTimes(2);
});

// --- 3. Degradation ----------------------------------------------------------

test('the offline queue RETAINS a mutation across a 5xx and replays it with its key', async () => {
  setFetch(jest.fn(async () => jsonErr(503, 'service unavailable')));
  // A restarting backend / bad gateway must not silently discard the write.
  await expect(runOrQueue('/api/food/logs', { food_name: 'Rice' })).resolves.toBeNull();
  expect(pendingCount()).toBe(1);

  const online = setFetch(jest.fn(async () => jsonOk({ id: 'srv-1' }, 201)));
  expect(await flush()).toEqual({ flushed: 1, remaining: 0 });
  const key = ((online.mock.calls[0][1] as RequestInit).headers as Record<string, string>)['Idempotency-Key'];
  expect(key).toBeTruthy(); // the replay is deduped server-side, not a second row
});

test('a permanent 4xx is still NOT queued (replaying it would fail forever)', async () => {
  setFetch(jest.fn(async () => jsonErr(400, 'bad request')));
  await expect(runOrQueue('/api/food/logs', { calories: -1 })).rejects.toBeInstanceOf(ApiError);
  expect(pendingCount()).toBe(0);
  expect(isTransient(new ApiError(400, 'bad'))).toBe(false);
  expect(isTransient(new ApiError(503, 'down'))).toBe(true);
});

test('a slow response does not lose the optimistic local write', async () => {
  let release: ((v: unknown) => void) | undefined;
  setFetch(jest.fn(() => new Promise((r) => { release = r; })));

  const before = useFoodStore.getState().meals.find((m) => m.slot === 'Lunch')!.items.length;
  const localId = logMeal('Lunch', { name: 'Rice', quantityG: 150, calories: 200, protein: 4, carbs: 44, fat: 1 });

  // Visible immediately, while the request is still in flight.
  const lunch = () => useFoodStore.getState().meals.find((m) => m.slot === 'Lunch')!;
  expect(lunch().items).toHaveLength(before + 1);
  expect(lunch().items.some((it) => it.id === localId)).toBe(true);

  // The server answers a long time later — the row survives and takes the server id.
  release!(jsonOk({ id: '11111111-2222-4333-8444-555555555555' }, 201));
  await tick();
  await tick();
  expect(lunch().items).toHaveLength(before + 1); // not duplicated
  expect(lunch().items.some((it) => it.id === '11111111-2222-4333-8444-555555555555')).toBe(true);
});

// The food store has NO cross-restart persistence, so a food write the backend
// refuses must reach the offline queue or it is gone at next launch.
test('a food log written while the backend 5xxs is queued, and survives an app restart', async () => {
  setFetch(jest.fn(async () => jsonErr(503, 'bad gateway')));
  logMeal('Dinner', { name: 'Curry', quantityG: 300, calories: 520, protein: 30, carbs: 55, fat: 18 });
  await tick();
  await tick();
  expect(pendingCount()).toBe(1);

  // App killed and relaunched: in-memory state is gone, the persisted queue is not.
  __resetMemoryForTests();
  const online = setFetch(jest.fn(async () => jsonOk({ id: '99999999-2222-4333-8444-555555555555' }, 201)));
  expect(await flush()).toEqual({ flushed: 1, remaining: 0 });
  const init = online.mock.calls[0][1] as RequestInit;
  expect(JSON.parse(init.body as string).food_name).toBe('Curry');
  expect((init.headers as Record<string, string>)['Idempotency-Key']).toBeTruthy();
});

test('when the queued write finally lands, the optimistic row takes the server id', async () => {
  const SERVER_ID = '77777777-2222-4333-8444-555555555555';
  setFetch(jest.fn(async () => jsonErr(503, 'down')));
  const localId = logMeal('Lunch', { name: 'Curry', quantityG: 300, calories: 520, protein: 30, carbs: 55, fat: 18 });
  await tick();
  await tick();
  const lunch = () => useFoodStore.getState().meals.find((m) => m.slot === 'Lunch')!;
  expect(lunch().items.some((it) => it.id === localId)).toBe(true); // still on screen
  expect(pendingCount()).toBe(1);

  setFetch(jest.fn(async () => jsonOk({ id: SERVER_ID }, 201)));
  await flush();
  // The local row became the server row — hydration can't show it twice.
  expect(lunch().items.some((it) => it.id === localId)).toBe(false);
  expect(lunch().items.filter((it) => it.id === SERVER_ID)).toHaveLength(1);
});

test('a 5xx hydration leaves local data intact and only rejects (hooks swallow it)', async () => {
  setFetch(jest.fn(async () => jsonErr(500, 'boom')));
  const before = useFoodStore.getState().meals;
  await expect(hydrateFoodLog()).rejects.toBeInstanceOf(ApiError);
  expect(useFoodStore.getState().meals).toBe(before); // untouched, nothing wiped
}, 15_000);

// --- 4/5. Deployment config --------------------------------------------------

test('EXPO_PUBLIC_API_URL is the only switch needed, and https works', async () => {
  const f = setFetch(jest.fn(async () => jsonOk({})));
  await withApiEnv({ EXPO_PUBLIC_API_URL: 'https://api.lumo.app' }, async (mod) => {
    await mod.api.goals.get();
    expect(f.mock.calls[0][0]).toBe('https://api.lumo.app/api/goals');
  });
});

test('a trailing slash on the configured origin does not produce a double slash', async () => {
  const f = setFetch(jest.fn(async () => jsonOk({})));
  await withApiEnv({ EXPO_PUBLIC_API_URL: 'https://api.lumo.app/' }, async (mod) => {
    await mod.api.goals.get();
    expect(f.mock.calls[0][0]).toBe('https://api.lumo.app/api/goals');
  });
});
