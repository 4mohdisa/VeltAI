// A failed read is reported, not swallowed.
//
// useHydration used to catch every fetch error and keep `error: null` — "the
// mock-seeded store IS the offline experience". So a screen could not tell
// "here is your data" from "we never reached the server", and it rendered
// whatever the store already held as though it were current. That is how
// Summary showed a seeded 13-day streak, and it applied to EVERY caller.
//
// These mount the hooks themselves — no screen — across three of the five
// callers, and require an honest error plus the data being left alone.
import { useDashboard, useFoodLog, useGym } from '@/lib/data';
import { useGymStore } from '@/lib/data/gymStore';
import { useFoodStore } from '@/lib/data/foodStore';
import { act, renderScreen } from './helpers';

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });
const STREAK = { current_streak: 7, longest_streak: 9, last_gym_date: '2026-09-13', freeze_used: false, last_freeze_date: null };

// A failed GET is retried twice with backoff (api.ts: 300ms, then 900ms), so the
// chain takes over a second to settle. Wait for the condition, not a fixed tick.
const settleUntil = async (done: () => boolean, ms = 6000) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    if (done()) return;
  }
};
const offline = () => {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() => Promise.reject(new TypeError('Network request failed')));
};
const online = () => {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string) => {
    if (url.includes('/api/gym/streak')) return json(STREAK);
    if (url.includes('/api/profile')) return json({ id: 'u1', email: 'a@b.c', display_name: 'T', avatar_url: null });
    return json([]);
  });
};

type State = { isLoading: boolean; error: Error | null; refetch: () => void };
const capture = (useHook: () => { isLoading: boolean; error: Error | null; refetch: () => void }) => {
  const seen: State[] = [];
  function Probe() {
    const s = useHook();
    seen.push({ isLoading: s.isLoading, error: s.error, refetch: s.refetch });
    return null;
  }
  renderScreen(<Probe />);
  return seen;
};
const last = (seen: State[]) => seen[seen.length - 1];

beforeEach(() => {
  useGymStore.getState().reset();
  useFoodStore.getState().reset();
});

describe('a failed read surfaces an error, on every caller', () => {
  test.each([
    ['useGym', () => useGym()],
    ['useFoodLog', () => useFoodLog()],
    ['useDashboard', () => useDashboard()],
  ])('%s reports the failure instead of swallowing it', async (_name, useHook) => {
    offline();
    const seen = capture(useHook as () => { isLoading: boolean; error: Error | null; refetch: () => void });
    await settleUntil(() => !last(seen).isLoading);

    expect(last(seen).isLoading).toBe(false);
    expect(last(seen).error).toBeInstanceOf(Error); // was null forever
  });
});

test('a successful read reports no error', async () => {
  online();
  const seen = capture(() => useGym());
  await settleUntil(() => !last(seen).isLoading);
  expect(last(seen).error).toBeNull();
  expect(useGymStore.getState().streak.current).toBe(7);
});

test('the failure leaves the store alone — the screen decides what to show', async () => {
  // Whatever the device already had is still there; it is the screen's job to
  // label it, which is what LoadFailedNotice does.
  const before = useGymStore.getState().streak.current;
  offline();
  const seen = capture(() => useGym());
  await settleUntil(() => !last(seen).isLoading);
  expect(useGymStore.getState().streak.current).toBe(before);
});

test('retrying after a failure clears the error', async () => {
  offline();
  const seen = capture(() => useGym());
  await settleUntil(() => !last(seen).isLoading);
  expect(last(seen).error).toBeInstanceOf(Error);

  online();
  await act(async () => {
    last(seen).refetch();
  });
  await settleUntil(() => last(seen).error === null);
  expect(last(seen).error).toBeNull();
  expect(useGymStore.getState().streak.current).toBe(7);
});
