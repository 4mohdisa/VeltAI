// useTemplates (src/lib/data/gymSchedule.ts) passes useApi's isError through, so
// My workouts can tell "the templates read failed" from "no workouts yet".
// Mounts the real hook through the shared harness and mocks @/lib/api at the
// module boundary.
import { useTemplates } from '@/lib/data/gymSchedule';

import { readHook } from './helpers/useApiHarness';

const mockGetTemplates = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { gym: { getTemplates: (...args: unknown[]) => mockGetTemplates(...args) } },
}));

const TEMPLATES = [
  {
    id: 't1',
    user_id: 'u1',
    name: 'Push day',
    estimated_duration_minutes: 45,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    exercises: [],
  },
];

beforeEach(() => mockGetTemplates.mockReset());

test('useTemplates reports isError when the load fails', async () => {
  mockGetTemplates.mockRejectedValueOnce(new TypeError('Network request failed'));
  expect(await readHook(useTemplates)).toMatchObject({ templates: [], loading: false, isError: true });
});

test('useTemplates reports no error when the load succeeds', async () => {
  mockGetTemplates.mockResolvedValueOnce(TEMPLATES);
  expect(await readHook(useTemplates)).toMatchObject({ templates: TEMPLATES, loading: false, isError: false });
});
