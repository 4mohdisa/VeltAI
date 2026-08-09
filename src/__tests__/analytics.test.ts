// First-party analytics — batching, flush, failure retention + cap, opt-out,
// restart persistence, allow-list, session id. fetch is mocked; secure-store is
// the in-memory jest mock (moduleNameMapper).
import { useSettingsStore } from '@/lib/settings/store';
import { deleteItem } from '@/lib/storage/secureStore';
import {
  track,
  flushAnalytics,
  initAnalytics,
  pendingCount,
  __resetForTests,
  __resetMemoryForTests,
  type AnalyticsEventName,
} from '@/lib/analytics';

type SentEvent = {
  name: string;
  session_id: string;
  client_ts: string;
  properties?: Record<string, unknown>;
};

function online() {
  const fn = jest.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve({ ok: true, status: 202, json: async () => ({ data: { accepted: 1 }, error: null }) }),
  );
  (globalThis as unknown as { fetch: unknown }).fetch = fn;
  return fn;
}
function offline() {
  (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
    Promise.reject(new TypeError('Network request failed')),
  );
}
const sentEvents = (fn: jest.Mock, call = 0): SentEvent[] =>
  (JSON.parse((fn.mock.calls[call][1] as RequestInit).body as string) as { events: SentEvent[] }).events;

beforeEach(async () => {
  useSettingsStore.getState().setAnalyticsEnabled(true);
  await __resetForTests();
});
afterEach(() => jest.restoreAllMocks());

test('events accumulate and flush sends ONE POST with the batch, then clears', async () => {
  track('food_logged', { method: 'manual' });
  track('scan_started');
  track('workout_logged');
  expect(pendingCount()).toBe(3);

  const fn = online();
  await flushAnalytics();
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn.mock.calls[0][0] as string).toContain('/api/analytics/events');
  const events = sentEvents(fn);
  expect(events.map((e) => e.name)).toEqual(['food_logged', 'scan_started', 'workout_logged']);
  // Build tags ride on every event so a funnel can be read per release and a
  // regression pinned to a commit (mocked expo-constants → fixed values).
  expect(events[0].properties).toEqual({
    method: 'manual',
    app_version: '1.0.0',
    build: '1',
    git_sha: 'testsha0000000000000000000000000000000a',
  });
  expect(events[1].properties).toMatchObject({ app_version: '1.0.0', build: '1' });
  expect(Number.isNaN(Date.parse(events[0].client_ts))).toBe(false); // RFC3339-parseable
  expect(pendingCount()).toBe(0);
});

test('buffer auto-flushes when it reaches 20 events', async () => {
  const fn = online();
  for (let i = 0; i < 20; i++) track('feature_used', { name: 'barcode' });
  await new Promise((r) => setTimeout(r, 0)); // let the fire-and-forget flush settle
  expect(fn).toHaveBeenCalledTimes(1);
  expect(pendingCount()).toBe(0);
});

test('a failed send keeps events; buffer caps at 200 dropping oldest; drains in ≤50 batches', async () => {
  offline();
  track('food_logged');
  track('scan_started');
  await flushAnalytics();
  expect(pendingCount()).toBe(2); // send failed → kept

  for (let i = 0; i < 210; i++) track('feature_used', { i });
  await new Promise((r) => setTimeout(r, 0));
  expect(pendingCount()).toBe(200); // capped

  const fn = online();
  await flushAnalytics();
  expect(fn).toHaveBeenCalledTimes(4); // 200 events → 4 batches of ≤50
  expect(sentEvents(fn, 0)).toHaveLength(50);
  expect(sentEvents(fn, 0)[0].name).toBe('feature_used'); // oldest (food_logged) was dropped
  expect(pendingCount()).toBe(0);
});

test('opt-out discards buffered events and makes track a no-op', async () => {
  track('food_logged');
  expect(pendingCount()).toBe(1);

  useSettingsStore.getState().setAnalyticsEnabled(false);
  expect(pendingCount()).toBe(0); // discarded immediately

  track('food_logged');
  expect(pendingCount()).toBe(0);
  const fn = online();
  await flushAnalytics();
  expect(fn).not.toHaveBeenCalled();
});

test('a failed send persists the buffer; it survives a restart', async () => {
  offline();
  track('food_logged');
  track('scan_started');
  await flushAnalytics(); // fails → persisted to secure-store

  // Simulate an app restart: drop in-memory state, then init reloads + flushes.
  __resetMemoryForTests();
  expect(pendingCount()).toBe(0);
  const fn = online();
  await initAnalytics();
  expect(fn).toHaveBeenCalledTimes(1);
  expect(sentEvents(fn).map((e) => e.name)).toEqual(['food_logged', 'scan_started']);
  expect(pendingCount()).toBe(0);
});

test('an unknown event name is dropped, never buffered', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  track('made_up_event' as AnalyticsEventName);
  expect(pendingCount()).toBe(0);
});

test('session_id is constant within a session and ≤64 chars', async () => {
  track('food_logged');
  track('scan_started');
  const fn = online();
  await flushAnalytics();
  const events = sentEvents(fn);
  expect(events[0].session_id).toBeTruthy();
  expect(events[0].session_id.length).toBeLessThanOrEqual(64);
  expect(events[1].session_id).toBe(events[0].session_id);
});

// The adversarial-review fix: the consent is a persisted privacy choice — it
// must survive both an app restart (store re-seeds to defaults) and sign-out.
describe('consent persistence (privacy promise)', () => {
  test('a refusal survives an app restart', async () => {
    online();
    useSettingsStore.getState().setAnalyticsEnabled(false);
    // Simulate a restart: fresh module memory + the store re-seeded to its default.
    __resetMemoryForTests();
    useSettingsStore.setState({ analyticsEnabled: true });
    await initAnalytics(); // must re-apply the persisted refusal before anything sends
    expect(useSettingsStore.getState().analyticsEnabled).toBe(false);
    track('food_logged');
    expect(pendingCount()).toBe(0); // still off — nothing buffers
  });

  test('a grant survives an app restart', async () => {
    online();
    useSettingsStore.getState().setAnalyticsEnabled(true);
    __resetMemoryForTests();
    useSettingsStore.setState({ analyticsEnabled: false });
    await initAnalytics();
    expect(useSettingsStore.getState().analyticsEnabled).toBe(true);
  });

  test('sign-out reset() does not re-enable analytics', () => {
    useSettingsStore.getState().setAnalyticsEnabled(false);
    useSettingsStore.getState().reset();
    expect(useSettingsStore.getState().analyticsEnabled).toBe(false);
  });
});

// --- opt-in (2026-08-09) -----------------------------------------------------
// The posture change itself: ON-by-default with a buried opt-out became an
// explicit ask. These are the tests that fail on the pre-change code.
describe('opt-in consent', () => {
  test('nothing is collected before the user answers', async () => {
    online();
    await deleteItem('lume.analyticsEnabled'); // never asked
    __resetMemoryForTests();
    useSettingsStore.setState({ analyticsEnabled: true }); // a stale/re-seeded store
    await initAnalytics();
    expect(useSettingsStore.getState().analyticsEnabled).toBe(false);
    track('food_logged');
    track('session_started');
    expect(pendingCount()).toBe(0);
  });

  test('the settings store default is off', () => {
    expect(useSettingsStore.getState().reset).toBeDefined();
    useSettingsStore.getState().reset();
    expect(useSettingsStore.getState().analyticsEnabled).toBe(false);
  });
});

// --- runtime PII enforcement -------------------------------------------------
// "NO PII in properties, EVER" was a comment and an erased TypeScript type. The
// wire payload had no runtime guard of any kind, while the debug path next to
// it was aggressively redacted. These assert the guard, not the comment.
describe('property sanitisation', () => {
  const propsOf = async (p: Record<string, string | number | boolean>) => {
    track('feature_used', p);
    const fn = online();
    await flushAnalytics();
    return sentEvents(fn)[0].properties as Record<string, unknown>;
  };

  test('free text and addresses never reach the wire', async () => {
    const out = await propsOf({
      name: 'barcode', // a legitimate scalar tag — kept
      food_name: 'Grandma’s chicken stir-fry', // user content — dropped
      email: 'isa@example.com', // PII — dropped
      note: 'felt bloated after lunch', // free text — dropped
    });
    expect(out.name).toBe('barcode');
    expect(out).not.toHaveProperty('food_name');
    expect(out).not.toHaveProperty('email');
    expect(out).not.toHaveProperty('note');
  });

  test('credentials are redacted by the same rules the debug system uses', async () => {
    const out = await propsOf({ token: 'sk_live_abcdef1234567890abcdef', name: 'barcode' });
    expect(JSON.stringify(out)).not.toContain('sk_live_abcdef1234567890abcdef');
  });

  test('scalars survive and non-scalars do not', async () => {
    const out = await propsOf({
      entry: 'camera',
      index: 3,
      ok: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deliberately off-contract
      nested: { a: 1 } as any,
    });
    expect(out).toMatchObject({ entry: 'camera', index: 3, ok: true });
    expect(out).not.toHaveProperty('nested');
  });
});

// --- failure visibility ------------------------------------------------------
// "fail silently to the user, but be visible in logs" — previously a failed
// send logged NOTHING in any build, and a permanently-rejected batch was
// retried forever, issuing a doomed POST on every subsequent track().
describe('flush failure handling', () => {
  test('a permanent rejection drops the batch and logs it', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    track('food_logged');
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 400, json: async () => ({ data: null, error: 'unknown event name' }) }),
    );
    await flushAnalytics();
    expect(pendingCount()).toBe(0); // dropped, not retried forever
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[analytics] dropped'), expect.anything());
  });

  test('a transient failure keeps the batch and logs it', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    track('food_logged');
    offline();
    await flushAnalytics();
    expect(pendingCount()).toBe(1); // kept for retry
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[analytics] flush failed'), expect.anything());
  });
});
