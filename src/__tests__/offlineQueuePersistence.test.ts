// What a long offline backlog does to the Keychain-backed queue.
//
// SIZE (measured against the real persisted shapes): a queued food write is
// ~286 bytes, a gym write ~369 with its exercise steps — 10 writes ~3.1KB, 50
// ~15KB, 100 ~31KB. The "~2KB" limit the queue's comment used to quote was
// Expo's OLD Android warning; expo-secure-store 56.0.4 validates no size on
// either platform and an iOS Keychain item holds tens of KB. So no cap and no
// compaction: a realistic backlog fits.
//
// The real hazard is the other one: the storage wrapper used to swallow EVERY
// write error, so a Keychain refusal (locked device during a background flush,
// storage full, encryption key invalidated by a reinstall) looked exactly like a
// successful save — and every queued write vanished at the next launch with no
// warning. These tests pin that it is now surfaced, once, without losing the
// in-memory queue.
// jest.resetModules() below re-requires the toast module, so the spy has to live
// outside the factory to stay the same function across reloads (the `mock` prefix
// is what lets the hoisted factory close over it).
const mockToast = jest.fn();
jest.mock('@/components/display/toastStore', () => ({
  showToast: (...args: unknown[]) => mockToast(...args),
}));

const toast = mockToast;

type Entry = { id: string; idempotencyKey: string; path: string; body: unknown; createdAt: number; steps?: unknown[] };
const foodEntry = (i: number): Entry => ({
  id: `m${i}-0-abc123`,
  idempotencyKey: `k${i}-0-def456`,
  path: '/api/food/logs',
  body: { date: '2026-09-12', meal_type: 'Breakfast', food_name: 'Greek yoghurt with berries', quantity: 200, unit: 'g', calories: 240, protein: 18, carbs: 22, fat: 8, source: 'manual' },
  createdAt: 1789000000000,
});
const bytes = (v: unknown) => Buffer.byteLength(JSON.stringify(v), 'utf8');

describe('the persisted footprint stays small enough to keep in the Keychain', () => {
  test('one queued write is a few hundred bytes, and 100 are tens of KB', () => {
    expect(bytes(foodEntry(1))).toBeLessThan(500);
    const hundred = Array.from({ length: 100 }, (_, i) => foodEntry(i));
    expect(bytes(hundred)).toBeLessThan(64 * 1024);
  });

  // Guards the reasoning above rather than a platform limit: if a queued body
  // ever carries something big (a base64 photo, say), this fails and the
  // "no cap needed" conclusion has to be revisited.
  test('a realistic day offline is a few KB, not hundreds', () => {
    const day = Array.from({ length: 30 }, (_, i) => foodEntry(i));
    expect(bytes(day)).toBeLessThan(16 * 1024);
  });
});

describe('a Keychain that refuses the write is not silently believed', () => {
  const loadQueueModule = (setItemAsync: jest.Mock) => {
    jest.resetModules();
    jest.doMock('expo-secure-store', () => ({
      getItemAsync: jest.fn(async () => null),
      setItemAsync,
      deleteItemAsync: jest.fn(async () => undefined),
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@/lib/offline/queue') as typeof import('@/lib/offline/queue');
  };

  beforeEach(() => {
    toast.mockClear();
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() => Promise.reject(new TypeError('Network request failed')));
  });
  afterEach(() => jest.restoreAllMocks());

  test('it warns once, keeps the writes in memory, and still syncs them', async () => {
    const failing = jest.fn(async () => {
      throw new Error('keychain refused');
    });
    const queue = loadQueueModule(failing);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await queue.runOrQueue('/api/food/logs', foodEntry(1).body);
    expect(failing).toHaveBeenCalled(); // it did try to persist
    expect(queue.pendingCount()).toBe(1); // and the write is not lost this session
    expect(toast).toHaveBeenCalledTimes(1);
    expect(String(toast.mock.calls[0][0].message)).toMatch(/offline changes/i);
    expect(warn).toHaveBeenCalled();

    // Still failing: the user is told once, not once per write.
    await queue.runOrQueue('/api/food/logs', foodEntry(2).body);
    expect(queue.pendingCount()).toBe(2);
    expect(toast).toHaveBeenCalledTimes(1);

    // The queue itself still works: back online, both land.
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
      Promise.resolve({ ok: true, status: 201, json: async () => ({ data: { id: 'srv-1' }, error: null }) }),
    );
    expect(await queue.flush()).toEqual({ flushed: 2, remaining: 0 });
  });

  test('a Keychain that accepts the write says nothing', async () => {
    const ok = jest.fn(async () => undefined);
    const queue = loadQueueModule(ok);
    await queue.runOrQueue('/api/food/logs', foodEntry(1).body);
    expect(queue.pendingCount()).toBe(1);
    expect(toast).not.toHaveBeenCalled();
  });
});
