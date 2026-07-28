// API client — envelope unwrapping, error propagation, the 401 hook, and auth
// header attachment. fetch is mocked; no network.
import { api, ApiError, setAuthTokenProvider, setUnauthorizedHandler } from '@/lib/api';

function mockFetch(impl: (url: string, init?: RequestInit) => { ok: boolean; status: number; json: () => Promise<unknown> }) {
  const fn = jest.fn((url: string, init?: RequestInit) => Promise.resolve(impl(url, init)));
  (globalThis as unknown as { fetch: unknown }).fetch = fn;
  return fn;
}

const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data, error: null }) });

afterEach(() => {
  // Reset the module-global auth seam so tests don't leak into each other.
  setAuthTokenProvider(() => Promise.resolve(null));
  setUnauthorizedHandler(() => {});
  jest.restoreAllMocks();
});

describe('api client envelope', () => {
  test('unwraps { data } on success', async () => {
    mockFetch(() => ok({ calorie_target: 2000 }));
    const g = await api.goals.get();
    expect(g.calorie_target).toBe(2000);
  });

  test('throws ApiError when the error field is set (even on 200)', async () => {
    mockFetch(() => ({ ok: true, status: 200, json: async () => ({ data: null, error: 'nope' }) }));
    await expect(api.goals.get()).rejects.toThrow(ApiError);
    await expect(api.goals.get()).rejects.toThrow('nope');
  });

  test('throws ApiError on non-2xx', async () => {
    mockFetch(() => ({ ok: false, status: 500, json: async () => ({ data: null, error: 'boom' }) }));
    await expect(api.goals.get()).rejects.toMatchObject({ status: 500 });
  });

  test('throws on a non-JSON body', async () => {
    mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('not json');
      },
    }));
    await expect(api.goals.get()).rejects.toThrow('invalid response envelope');
  });
});

describe('api client 401 handling', () => {
  test('fires the unauthorized handler and still throws', async () => {
    const onUnauth = jest.fn();
    setUnauthorizedHandler(onUnauth);
    mockFetch(() => ({ ok: false, status: 401, json: async () => ({ data: null, error: 'unauthorized' }) }));
    await expect(api.goals.get()).rejects.toBeInstanceOf(ApiError);
    expect(onUnauth).toHaveBeenCalledTimes(1);
  });
});

describe('api client auth + query', () => {
  test('attaches the bearer token when a provider is set', async () => {
    setAuthTokenProvider(() => Promise.resolve('tok-123'));
    const fetchFn = mockFetch(() => ok({}));
    await api.goals.get();
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-123');
  });

  test('omits Authorization when no token', async () => {
    const fetchFn = mockFetch(() => ok({}));
    await api.goals.get();
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  test('serializes defined query params and drops undefined', async () => {
    const fetchFn = mockFetch(() => ok({ date: 'x', calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }));
    await api.foodLogs.summary('2026-07-01');
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toContain('/api/food/summary?date=2026-07-01');
  });

  test('energy + integrations endpoints hit the right paths', async () => {
    const fetchFn = mockFetch(() => ok({}));
    await api.energy.getWeek();
    await api.integrations.list();
    expect(fetchFn.mock.calls[0][0]).toContain('/api/energy-balance/week');
    expect(fetchFn.mock.calls[1][0]).toContain('/api/integrations');
  });

  test('profile.delete issues DELETE /api/profile', async () => {
    const fetchFn = mockFetch(() => ok({ deleted: true }));
    const res = await api.profile.delete();
    expect(res.deleted).toBe(true);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/profile');
    expect(init.method).toBe('DELETE');
  });
});

// --- Entitlement gate (402) --------------------------------------------------
// The backend's gate sends a STRUCTURED error object so the client can present
// the paywall instead of a generic failure. Both error shapes must work.
describe('entitlement 402', () => {
  test('structured 402 sets upgradeRequired + feature and keeps the message readable', async () => {
    mockFetch(() => ({
      ok: false,
      status: 402,
      json: async () => ({
        data: null,
        error: { message: "You've used all your free scans for today.", upgrade_required: true, feature: 'ai_scan', limit: 3 },
      }),
    }));
    const err = await api.scan.pipeline('b64', 'image/jpeg').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const e = err as ApiError;
    expect(e.status).toBe(402);
    expect(e.upgradeRequired).toBe(true);
    expect(e.feature).toBe('ai_scan');
    // Never "[object Object]" in front of a user.
    expect(e.message).toContain('free scans');
  });

  test('a plain string error still parses and is NOT an upgrade prompt', async () => {
    mockFetch(() => ({ ok: false, status: 500, json: async () => ({ data: null, error: 'database error' }) }));
    const err = (await api.foodLogs.list().catch((e: unknown) => e)) as ApiError;
    expect(err.message).toBe('database error');
    expect(err.upgradeRequired).toBe(false);
  });
});
