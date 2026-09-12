// A gym log records what was actually logged — never a stand-in duration.
//
// The local store used to stamp every session with durationMin 60 and effort 7,
// and the API mapper stamped hydrated rows with durationMin 0 / effort 0. That is
// not cosmetic: the backend turns a session duration into burned calories
// (energy.CalculateSessionCalories — no exercises and no duration returns 0, but
// 60 minutes returns avgMET 5.0 × 70kg × 1h ≈ 350 kcal), and that figure flows
// into calories_out_exercise and the Summary energy balance. A one-tap log knows
// the date and nothing else, so everything else stays null.
import { readFileSync } from 'fs';
import { join } from 'path';

import { useGymStore } from '@/lib/data/gymStore';
import { sessionsFromApi, todayISO } from '@/lib/data/mappers';
import type { GymSession as ApiGymSession } from '@/lib/api';

const apiRow = (over: Partial<ApiGymSession> = {}): ApiGymSession => ({
  id: 'srv-1',
  user_id: 'u1',
  date: todayISO(),
  name: null,
  notes: null,
  duration_minutes: null,
  created_at: `${todayISO()}T18:00:00Z`,
  ...over,
});

beforeEach(() => {
  useGymStore.getState().reset();
  useGymStore.setState((s) => ({ streak: { ...s.streak, gymLoggedToday: false } }));
});

test('a one-tap log asserts no duration and no effort', () => {
  useGymStore.getState().logGymSession();
  const [session] = useGymStore.getState().sessions;
  expect(session.durationMin).toBeNull();
  expect(session.effort).toBeNull();
  expect(useGymStore.getState().loggedDays).toEqual([{ date: todayISO(), minutes: null }]);
});

test('a log that DID record a duration and effort keeps them', () => {
  useGymStore.getState().logGymSession({ durationMin: 45, effort: 8 });
  const [session] = useGymStore.getState().sessions;
  expect(session.durationMin).toBe(45);
  expect(session.effort).toBe(8);
  expect(useGymStore.getState().loggedDays[0].minutes).toBe(45);
});

test("the server's null duration stays null, and effort it has no column for stays null", () => {
  expect(sessionsFromApi([apiRow()])[0]).toMatchObject({ durationMin: null, effort: null });
  expect(sessionsFromApi([apiRow({ duration_minutes: 80 })])[0]).toMatchObject({ durationMin: 80, effort: null });
});

test('the log-session sheet starts at "Not set" and sends nothing when nothing was set', () => {
  const sheet = readFileSync(join(__dirname, '..', 'app/gym/log-session.tsx'), 'utf8');
  expect(sheet).toContain('useState(0)');
  expect(sheet).toContain('duration > 0 ? duration : undefined');
  expect(sheet).not.toContain('useState(60)');
});
