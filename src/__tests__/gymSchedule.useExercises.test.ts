// useExercises (src/lib/data/gymSchedule.ts) passes useApi's isError through, so
// the exercise library can tell "the read failed" from "no exercises match".
// Mounts the real hook through the shared harness and mocks @/lib/api at the
// module boundary.
import { useExercises } from '@/lib/data/gymSchedule';

import { readHook } from './helpers/useApiHarness';

const mockGetExercises = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { gym: { getExercises: (...args: unknown[]) => mockGetExercises(...args) } },
}));

const EXERCISES = [
  {
    id: 'e1',
    name: 'Bench press',
    muscle_group_primary: 'chest',
    muscle_groups_secondary: ['triceps'],
    category: 'push',
    exercise_type: 'strength',
    equipment: 'barbell',
    difficulty: 'intermediate',
    description: 'Press the bar from the chest.',
    met_value: 5,
  },
];

beforeEach(() => mockGetExercises.mockReset());

test('useExercises reports isError when the load fails', async () => {
  mockGetExercises.mockRejectedValueOnce(new TypeError('Network request failed'));
  expect(await readHook(() => useExercises())).toMatchObject({ exercises: [], loading: false, isError: true });
});

test('useExercises reports no error when the load succeeds', async () => {
  mockGetExercises.mockResolvedValueOnce(EXERCISES);
  expect(await readHook(() => useExercises())).toMatchObject({ exercises: EXERCISES, loading: false, isError: false });
});
