// V7 — a session logged through the app's real write path lands on the Gym
// calendar on its real date, and is counted exactly once when the server's row
// is read back. This is the write half of the "real streak beside a false
// 0 sessions" fix; gymMonth.test.ts pins the read half.
//
// fetch is mocked (as in gymOfflineSequence.test.ts); secure-store is the
// in-memory jest mock.
import { __resetForTests } from '@/lib/offline/queue';
import { logGymSession } from '@/lib/data/mutations';
import { useGymStore } from '@/lib/data/gymStore';
import { monthSummary, monthView } from '@/lib/data/gymRange';
import { todayISO } from '@/lib/data/mappers';
import type { GymSession } from '@/lib/api';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

type Call = [string, RequestInit?];
let fetchMock: jest.Mock;
const posts = () =>
  (fetchMock.mock.calls as Call[])
    .filter(([, init]) => init?.method === 'POST')
    .map(([url, init]) => ({ path: url.replace('http://localhost:8080', ''), body: JSON.parse(String(init?.body ?? '{}')) }));

beforeEach(async () => {
  await __resetForTests();
  useGymStore.getState().reset();
  useGymStore.setState((s) => ({ streak: { ...s.streak, gymLoggedToday: false } }));
  fetchMock = jest.fn(() =>
    Promise.resolve({ ok: true, status: 201, json: async () => ({ data: { id: 'sess-1' }, error: null }) }),
  );
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
});

test('logging a session POSTs it for TODAY and the calendar shows it on today', async () => {
  logGymSession({ durationMin: 45 });
  await new Promise((r) => setImmediate(r));

  const today = todayISO();
  // The server is told the real day and the real length — nothing re-dated.
  expect(posts()).toEqual([{ path: '/api/gym/sessions', body: expect.objectContaining({ date: today, duration_minutes: 45 }) }]);

  // Before the month is re-read, the calendar draws the local echo on today.
  const { loggedDays } = useGymStore.getState();
  const before = monthView(today, today, [], loggedDays, []);
  expect(before.cells.find((c) => c?.date === today)).toMatchObject({ sessions: 1, minutes: 45, level: 2 });
  expect(monthSummary(before)).toBe('1 session · 0h 45m');

  // After the re-read, the server's row replaces the echo: still one session.
  const row: GymSession = { id: 'sess-1', user_id: 'u1', date: today, name: null, notes: null, duration_minutes: 45, created_at: `${today}T18:00:00Z` };
  const after = monthView(today, today, [row], loggedDays, []);
  expect(after.sessions).toBe(1);
  expect(monthSummary(after)).toBe('1 session · 0h 45m');
});

test('a one-tap log with no duration is drawn as a session, never as a rest day or a fake length', async () => {
  logGymSession();
  await new Promise((r) => setImmediate(r));
  const today = todayISO();
  expect(posts()[0].body).toMatchObject({ date: today });
  expect(posts()[0].body.duration_minutes).toBeUndefined();

  const view = monthView(today, today, [], useGymStore.getState().loggedDays, []);
  expect(view.cells.find((c) => c?.date === today)).toMatchObject({ sessions: 1, minutes: null, level: 1 });
  expect(monthSummary(view)).toBe('1 session · 1 untimed');
});
