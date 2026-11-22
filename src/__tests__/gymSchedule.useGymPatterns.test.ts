// useGymPatterns (src/lib/data/gymSchedule.ts) passes useApi's isError through,
// so a patterns card can tell "the read failed" from "no patterns yet". Mounts
// the real hook through the shared harness and mocks @/lib/api at the module
// boundary.
import { useGymPatterns } from '@/lib/data/gymSchedule';

import { readHook } from './helpers/useApiHarness';

const mockGetGymPatterns = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { gym: { getGymPatterns: (...args: unknown[]) => mockGetGymPatterns(...args) } },
}));

const PATTERNS = {
  most_trained_muscles: ['chest'],
  least_trained_muscles: ['calves'],
  avg_sessions_per_week: 3,
  adherence_rate: 0.8,
  customization_rate: 0.2,
  most_missed_day: 'Friday',
  muscle_volume_map: null,
  last_rebuilt: null,
};

beforeEach(() => mockGetGymPatterns.mockReset());

test('useGymPatterns reports isError when the load fails', async () => {
  mockGetGymPatterns.mockRejectedValueOnce(new TypeError('Network request failed'));
  expect(await readHook(useGymPatterns)).toMatchObject({ patterns: null, loading: false, isError: true });
});

test('useGymPatterns reports no error when the load succeeds', async () => {
  mockGetGymPatterns.mockResolvedValueOnce(PATTERNS);
  expect(await readHook(useGymPatterns)).toMatchObject({ patterns: PATTERNS, loading: false, isError: false });
});
