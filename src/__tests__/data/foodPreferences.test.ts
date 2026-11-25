// hydrateFoodPreferences and saveFoodPreferences, the data steps behind diet and
// cuisine on Profile > Preferences, through the real API client with fetch
// mocked at the network edge.
import { hydrateFoodPreferences, saveFoodPreferences } from '@/lib/data';
import { useUserStore } from '@/lib/data/userStore';

type Init = { method?: string; body?: string };
const json = (data: unknown, status = 200) =>
  Promise.resolve({ ok: status < 300, status, json: async () => ({ data, error: status < 300 ? null : 'error' }) });

let calls: { url: string; method: string; body: unknown }[];
const setFetch = (respond: (method: string, body: Record<string, unknown>) => Promise<unknown>) => {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn((url: string, init?: Init) => {
    const method = init?.method ?? 'GET';
    const body = init?.body ? (JSON.parse(init.body) as Record<string, unknown>) : {};
    calls.push({ url, method, body: init?.body ? body : undefined });
    return respond(method, body);
  });
};

beforeEach(() => {
  calls = [];
  useUserStore.getState().resetProfile();
});

test('hydrate reads GET /api/onboarding/preferences into the user store', async () => {
  setFetch(() => json({ cuisines: ['south_asian'], dietary_requirements: ['halal'] }));

  await hydrateFoodPreferences();

  expect(calls[0]).toMatchObject({ method: 'GET' });
  expect(calls[0].url).toContain('/api/onboarding/preferences');
  expect(useUserStore.getState().profile.cuisines).toEqual(['south_asian']);
  expect(useUserStore.getState().profile.restrictions).toEqual(['halal']);
});

test('saving cuisines PATCHes only cuisines and stores what the server returned', async () => {
  setFetch((_, body) => json({ cuisines: body.cuisines, dietary_requirements: ['halal'] }));

  await saveFoodPreferences({ cuisines: ['western'] });

  expect(calls).toHaveLength(1);
  expect(calls[0]).toMatchObject({ method: 'PATCH', body: { cuisines: ['western'] } });
  expect(calls[0].url).toContain('/api/onboarding/preferences');
  expect(useUserStore.getState().profile.cuisines).toEqual(['western']);
  expect(useUserStore.getState().profile.restrictions).toEqual(['halal']);
});

test('a rejected save throws and leaves the store as it was', async () => {
  useUserStore.getState().setProfile({ cuisines: ['south_asian'], restrictions: ['halal'] });
  setFetch(() => json(null, 400));

  await expect(saveFoodPreferences({ dietary: ['vegan'] })).rejects.toThrow();

  expect(calls[0]).toMatchObject({ method: 'PATCH', body: { dietary_requirements: ['vegan'] } });
  expect(useUserStore.getState().profile.restrictions).toEqual(['halal']);
});
