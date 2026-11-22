// useExercises and useExerciseProgress (src/lib/data/gymSchedule.ts) re-fetch
// when their input changes, and a successful re-fetch after a failure clears
// isError. Mounts the real hooks through the shared harness and mocks @/lib/api
// at the module boundary.
import { useExercises, useExerciseProgress } from '@/lib/data/gymSchedule';
import type { ExerciseFilters } from '@/lib/types';

import { mountHook } from './helpers/useApiHarness';

const mockGetExercises = jest.fn();
const mockGetExerciseProgress = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: {
      getExercises: (...args: unknown[]) => mockGetExercises(...args),
      getExerciseProgress: (...args: unknown[]) => mockGetExerciseProgress(...args),
    },
  },
}));

const BENCH = {
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
};

const progressFor = (exercise_name: string) => ({
  exercise_name,
  history: [{ date: '2026-11-01', weight: 60, reps: 8, sets: 3 }],
  personal_best: { weight: 60, reps: 8, date: '2026-11-01' },
  trend: 'maintaining',
});

const useExercisesWith = (filters: ExerciseFilters) => useExercises(filters);
const useProgressFor = (name: string) => useExerciseProgress(name);

beforeEach(() => {
  mockGetExercises.mockReset();
  mockGetExerciseProgress.mockReset();
});

describe('useExercises', () => {
  test('a failed fetch sets isError, and a successful fetch after a filter change clears it', async () => {
    mockGetExercises.mockRejectedValueOnce(new TypeError('Network request failed'));
    const hook = await mountHook(useExercisesWith, { category: 'push' });
    expect(hook.latest()).toMatchObject({ exercises: [], loading: false, isError: true });

    mockGetExercises.mockResolvedValueOnce([BENCH]);
    await hook.rerender({ category: 'pull' });
    expect(hook.latest()).toMatchObject({ exercises: [BENCH], loading: false, isError: false });
    hook.unmount();
  });

  test('refetches with the new filters when they change, and not for an equal filter object', async () => {
    mockGetExercises.mockResolvedValue([BENCH]);
    const hook = await mountHook(useExercisesWith, { category: 'push' });
    expect(mockGetExercises).toHaveBeenCalledTimes(1);

    await hook.rerender({ category: 'push' });
    expect(mockGetExercises).toHaveBeenCalledTimes(1);

    await hook.rerender({ category: 'push', q: 'bench' });
    expect(mockGetExercises).toHaveBeenCalledTimes(2);
    expect(mockGetExercises).toHaveBeenLastCalledWith({ category: 'push', q: 'bench' });
    hook.unmount();
  });
});

describe('useExerciseProgress', () => {
  test('a failed fetch sets isError, and a successful fetch for another exercise clears it', async () => {
    mockGetExerciseProgress.mockRejectedValueOnce(new TypeError('Network request failed'));
    const hook = await mountHook(useProgressFor, 'Bench press');
    expect(hook.latest()).toMatchObject({ progress: null, loading: false, isError: true });

    mockGetExerciseProgress.mockResolvedValueOnce(progressFor('Squat'));
    await hook.rerender('Squat');
    expect(hook.latest()).toMatchObject({ progress: progressFor('Squat'), loading: false, isError: false });
    hook.unmount();
  });

  test('refetches when the exercise changes', async () => {
    mockGetExerciseProgress.mockImplementation((name: string) => Promise.resolve(progressFor(name)));
    const hook = await mountHook(useProgressFor, 'Bench press');
    expect(mockGetExerciseProgress).toHaveBeenLastCalledWith('Bench press', undefined);

    await hook.rerender('Squat');
    expect(mockGetExerciseProgress).toHaveBeenCalledTimes(2);
    expect(mockGetExerciseProgress).toHaveBeenLastCalledWith('Squat', undefined);
    expect(hook.latest()).toMatchObject({ progress: progressFor('Squat'), isError: false });
    hook.unmount();
  });
});
