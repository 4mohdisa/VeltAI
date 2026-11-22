// useInsights (src/lib/data/aiBrain.ts) handles api.ai.getInsights rejecting,
// so a failed read is reported through isError instead of escaping as an
// unhandled rejection. Mounts the real hook through the shared harness and
// mocks @/lib/api at the module boundary.
import { useInsights } from '@/lib/data/aiBrain';

import { readHook } from './helpers/useApiHarness';

const mockGetInsights = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    ai: {
      getInsights: (...args: unknown[]) => mockGetInsights(...args),
      getAnomalies: () => Promise.resolve([]),
    },
  },
}));

const INSIGHTS = [
  {
    id: 'i1',
    type: null,
    title: 'Protein is up',
    body: 'You hit your protein goal four days running.',
    data: null,
    shown_at: null,
    dismissed: false,
    created_at: '2026-11-01T00:00:00Z',
  },
];

beforeEach(() => mockGetInsights.mockReset());

test('useInsights reports isError when getInsights fails', async () => {
  mockGetInsights.mockRejectedValueOnce(new TypeError('Network request failed'));
  expect(await readHook(useInsights)).toMatchObject({ insights: [], loading: false, isError: true });
});

test('useInsights reports no error when getInsights succeeds', async () => {
  mockGetInsights.mockResolvedValueOnce(INSIGHTS);
  expect(await readHook(useInsights)).toMatchObject({ insights: INSIGHTS, loading: false, isError: false });
});
