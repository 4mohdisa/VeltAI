// The ai.* client functions: real endpoints reject with ApiError on failure,
// and only the endpoints the backend doesn't expose degrade to empty. These
// verify that intent without rendering a hook.
import { api, ApiError } from '@/lib/api';

function mockFetch(impl: () => { ok: boolean; status: number; json: () => Promise<unknown> }) {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() => Promise.resolve(impl()));
}
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data, error: null }) });
const fail = () => ({ ok: false, status: 500, json: async () => ({ data: null, error: 'down' }) });

afterEach(() => jest.restoreAllMocks());

describe('ai fallbacks', () => {
  test('getMorningBrief returns null when there is no brief', async () => {
    mockFetch(() => ok({ state: 'not_enough_data' }));
    expect(await api.ai.getMorningBrief()).toBeNull();
  });

  test('getMorningBrief maps a real brief', async () => {
    mockFetch(() => ok({ brief: 'Eat more protein today.' }));
    const b = await api.ai.getMorningBrief();
    expect(b?.brief).toBe('Eat more protein today.');
  });

  test('getMorningBrief rejects with ApiError on error, not null', async () => {
    mockFetch(fail);
    await expect(api.ai.getMorningBrief()).rejects.toBeInstanceOf(ApiError);
  });

  test('getInsights rejects with ApiError on error, not an empty list', async () => {
    mockFetch(fail);
    await expect(api.ai.getInsights()).rejects.toBeInstanceOf(ApiError);
  });

  test('getInsights maps rows', async () => {
    mockFetch(() => ok([{ id: '1', type: 't', title: 'T', body: 'B', created_at: '2026-07-01' }]));
    const rows = await api.ai.getInsights();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('T');
  });

  test('getAnomalies returns [] when the endpoint is absent', async () => {
    mockFetch(fail);
    await expect(api.ai.getAnomalies()).resolves.toEqual([]);
  });

  test('getProfile rejects with ApiError on error, not null', async () => {
    mockFetch(fail);
    await expect(api.ai.getProfile()).rejects.toBeInstanceOf(ApiError);
  });

  test('getProfile honours not_enough_data', async () => {
    mockFetch(() => ok({ state: 'not_enough_data' }));
    const p = await api.ai.getProfile();
    expect(p?.not_enough_data).toBe(true);
  });
});
