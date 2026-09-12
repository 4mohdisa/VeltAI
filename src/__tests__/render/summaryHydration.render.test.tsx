// Summary hydrates itself.
//
// The bug this pins: Summary reads the gym store (streak) and the food store
// (macros), both of which the Gym and Food tabs own — and useDashboard's
// isLoading used to be a 600ms cosmetic timer with NO fetch behind it. The only
// real read was pull-to-refresh. So a cold launch that stayed on Summary showed
// the SEEDED streak and macros as if they were current, indefinitely (13 days in
// this dev build, 0 in a release build).
//
// These tests mount ONLY Summary's own hook — no Gym or Food screen anywhere —
// and require that the reads fire and the stores actually take the server's
// values.
import { useDashboard } from '@/lib/data';
import { useGymStore } from '@/lib/data/gymStore';
import { useFoodStore } from '@/lib/data/foodStore';
import { act, renderScreen } from './helpers';

const STREAK = {
  current_streak: 5,
  longest_streak: 9,
  last_gym_date: '2026-09-12',
  freeze_used: false,
  last_freeze_date: null,
};

const json = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => ({ data, error: null }) });
let fetchMock: jest.Mock;
const urls = () => (fetchMock.mock.calls as [string][]).map(([u]) => u.replace('http://localhost:8080', ''));
const hit = (fragment: string) => urls().some((u) => u.includes(fragment));

// Summary's hook, mounted on its own. Nothing else renders.
function Probe() {
  useDashboard();
  return null;
}

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

beforeEach(() => {
  useGymStore.getState().reset();
  useFoodStore.getState().reset();
  fetchMock = jest.fn((url: string) => {
    if (url.includes('/api/gym/streak')) return json(STREAK);
    if (url.includes('/api/gym/sessions')) return json([]);
    if (url.includes('/api/food/logs')) return json([]);
    if (url.includes('/api/profile')) return json({ id: 'u1', email: 'a@b.c', display_name: 'Test', avatar_url: null });
    return json([]);
  });
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
});

test('mounting Summary alone fetches the streak and the food log', async () => {
  renderScreen(<Probe />);
  await settle();

  expect(hit('/api/gym/streak')).toBe(true);
  expect(hit('/api/gym/sessions')).toBe(true);
  expect(hit('/api/food/logs')).toBe(true);
});

test("the store takes the server's streak, so Summary stops showing its seed", async () => {
  // The seed is what a real user was shown forever: 13 in dev, 0 in release.
  const seeded = useGymStore.getState().streak.current;
  renderScreen(<Probe />);
  await settle();

  expect(useGymStore.getState().streak.current).toBe(5);
  expect(useGymStore.getState().streak.current).not.toBe(seeded);
});

test('isLoading is true until the reads settle, and false after', async () => {
  let seen: boolean[] = [];
  function Watch() {
    seen.push(useDashboard().isLoading);
    return null;
  }
  seen = [];
  renderScreen(<Watch />);
  expect(seen[0]).toBe(true); // first paint: nothing true to show yet
  await settle();
  expect(seen[seen.length - 1]).toBe(false);
});
