// DESIGN_INTENT.md Fix 4: lastSetsFor picks the sets an exercise was last logged
// with, so the gym session prefills from the last session rather than the plan.
import type { GymExercise, GymSession } from '@/lib/api';
import { lastSetsFor } from '@/lib/data/gymRange';

const exercise = (name: string, sets: number | null, reps: number | null, weight: number | null): GymExercise => ({
  id: `${name}-${sets}-${weight}`,
  session_id: 's',
  name,
  sets,
  reps,
  weight,
  weight_unit: 'kg',
  rest_seconds: null,
  notes: null,
});
const session = (id: string, date: string, exercises: GymExercise[]): GymSession => ({
  id,
  user_id: 'u',
  date,
  name: null,
  notes: null,
  duration_minutes: null,
  created_at: `${date}T10:00:00Z`,
  exercises,
});

test('no history returns null', () => {
  expect(lastSetsFor('Bench Press', [], null)).toBeNull();
});

test('the most recent session wins, by date and then by id', () => {
  const sessions = [
    session('a', '2026-11-20', [exercise('Bench Press', 3, 8, 60)]),
    session('c', '2026-11-25', [exercise('Bench Press', 4, 6, 72.5)]),
    session('b', '2026-11-25', [exercise('Bench Press', 5, 5, 70)]),
  ];
  expect(lastSetsFor('Bench Press', sessions, null)).toEqual({ sets: 4, reps: 6, weight: 72.5 });
});

test('other exercises are ignored, and the name matches regardless of case', () => {
  const sessions = [
    session('a', '2026-11-20', [exercise('bench press', 3, 8, 60)]),
    session('b', '2026-11-25', [exercise('Squat', 5, 5, 100)]),
  ];
  expect(lastSetsFor('Bench Press', sessions, null)).toEqual({ sets: 3, reps: 8, weight: 60 });
});

test('the current session is ignored', () => {
  const sessions = [
    session('a', '2026-11-20', [exercise('Bench Press', 3, 8, 60)]),
    session('today', '2026-11-27', [exercise('Bench Press', 1, 1, 200)]),
  ];
  expect(lastSetsFor('Bench Press', sessions, 'today')).toEqual({ sets: 3, reps: 8, weight: 60 });
});

test('a last session that logged the exercise with zero sets returns null, so the plan stands', () => {
  const sessions = [
    session('a', '2026-11-20', [exercise('Bench Press', 3, 8, 60)]),
    session('b', '2026-11-25', [exercise('Bench Press', 0, null, null)]),
  ];
  expect(lastSetsFor('Bench Press', sessions, null)).toBeNull();
});

test('a missing reps or weight is left out, so the plan fills that value', () => {
  const sessions = [session('a', '2026-11-20', [exercise('Bench Press', 2, null, 50)])];
  expect(lastSetsFor('Bench Press', sessions, null)).toStrictEqual({ sets: 2, weight: 50 });
});
