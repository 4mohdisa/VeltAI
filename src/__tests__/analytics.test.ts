// First-party analytics — batching, flush, failure retention + cap, opt-out,
// restart persistence, allow-list, session id. fetch is mocked; secure-store is
// the in-memory jest mock (moduleNameMapper).
import { useSettingsStore } from '@/lib/settings/store';
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
  expect(events[0].properties).toEqual({ method: 'manual' });
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

// The adversarial-review fix: the opt-out is a persisted privacy choice — it
// must survive both an app restart (store re-seeds to defaults) and sign-out.
describe('opt-out persistence (privacy promise)', () => {
  test('opt-out survives an app restart', async () => {
    online();
    useSettingsStore.getState().setAnalyticsEnabled(false);
    // Simulate a restart: fresh module memory + the store re-seeded to its default.
    __resetMemoryForTests();
    useSettingsStore.setState({ analyticsEnabled: true });
    await initAnalytics(); // must re-apply the persisted opt-out before anything sends
    expect(useSettingsStore.getState().analyticsEnabled).toBe(false);
    track('food_logged');
    expect(pendingCount()).toBe(0); // still off — nothing buffers
  });

  test('sign-out reset() does not re-enable analytics', () => {
    useSettingsStore.getState().setAnalyticsEnabled(false);
    useSettingsStore.getState().reset();
    expect(useSettingsStore.getState().analyticsEnabled).toBe(false);
  });
});
