// useSchedule (src/lib/data/gymSchedule.ts) passes useApi's isError through, so
// the schedule screen can tell "the schedule read failed" from "nothing planned".
// Mounts the real hook through the shared harness and mocks @/lib/api at the
// module boundary.
import { useSchedule } from '@/lib/data/gymSchedule';

import { readHook } from './helpers/useApiHarness';

const mockGetSchedule = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { gym: { getSchedule: (...args: unknown[]) => mockGetSchedule(...args) } },
}));

const SCHEDULE = [
  { day_of_week: 0, day_name: 'Sunday', is_rest_day: true, template_id: null, template: null },
];

beforeEach(() => mockGetSchedule.mockReset());

test('useSchedule reports isError when the load fails', async () => {
  mockGetSchedule.mockRejectedValueOnce(new TypeError('Network request failed'));
  expect(await readHook(useSchedule)).toMatchObject({ schedule: [], loading: false, isError: true });
});

test('useSchedule reports no error when the load succeeds', async () => {
  mockGetSchedule.mockResolvedValueOnce(SCHEDULE);
  expect(await readHook(useSchedule)).toMatchObject({ schedule: SCHEDULE, loading: false, isError: false });
});
