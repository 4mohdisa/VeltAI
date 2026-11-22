// useExerciseProgress (src/lib/data/gymSchedule.ts) passes useApi's isError
// through, so a progress chart can tell "the read failed" from "no history yet".
// An empty name skips the API and is not an error. Mounts the real hook through
// the shared harness and mocks @/lib/api at the module boundary.
import { useExerciseProgress } from '@/lib/data/gymSchedule';

import { readHook } from './helpers/useApiHarness';

const mockGetExerciseProgress = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { gym: { getExerciseProgress: (...args: unknown[]) => mockGetExerciseProgress(...args) } },
}));

const PROGRESS = {
  exercise_name: 'Bench press',
  history: [{ date: '2026-11-01', weight: 60, reps: 8, sets: 3 }],
  personal_best: { weight: 60, reps: 8, date: '2026-11-01' },
  trend: 'maintaining',
};

beforeEach(() => mockGetExerciseProgress.mockReset());

test('useExerciseProgress reports isError when the load fails', async () => {
  mockGetExerciseProgress.mockRejectedValueOnce(new TypeError('Network request failed'));
  expect(await readHook(() => useExerciseProgress('Bench press'))).toMatchObject({
    progress: null,
    loading: false,
    isError: true,
  });
});

test('useExerciseProgress reports no error when the load succeeds', async () => {
  mockGetExerciseProgress.mockResolvedValueOnce(PROGRESS);
  expect(await readHook(() => useExerciseProgress('Bench press'))).toMatchObject({
    progress: PROGRESS,
    loading: false,
    isError: false,
  });
});

test('useExerciseProgress with an empty name skips the API and reports no error', async () => {
  expect(await readHook(() => useExerciseProgress(''))).toMatchObject({
    progress: null,
    loading: false,
    isError: false,
  });
  expect(mockGetExerciseProgress).not.toHaveBeenCalled();
});
