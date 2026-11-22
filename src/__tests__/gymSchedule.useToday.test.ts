// useToday (src/lib/data/gymSchedule.ts) passes useApi's isError through, so a
// gym screen can tell "today's read failed" from "nothing scheduled". Mounts
// the real hook through the shared harness and mocks @/lib/api at the module
// boundary.
import { useToday } from '@/lib/data/gymSchedule';

import { readHook } from './helpers/useApiHarness';

const mockGetToday = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { gym: { getToday: (...args: unknown[]) => mockGetToday(...args) } },
}));

const WORKOUT = {
  day_of_week: 2,
  day_name: 'Tuesday',
  is_rest_day: false,
  template: null,
  exercises: [],
  already_checked_in: false,
  session_id: null,
};

beforeEach(() => mockGetToday.mockReset());

test('useToday reports isError when the load fails', async () => {
  mockGetToday.mockRejectedValueOnce(new TypeError('Network request failed'));
  expect(await readHook(useToday)).toMatchObject({ today: null, loading: false, isError: true });
});

test('useToday reports no error when the load succeeds', async () => {
  mockGetToday.mockResolvedValueOnce(WORKOUT);
  expect(await readHook(useToday)).toMatchObject({ today: WORKOUT, loading: false, isError: false });
});
