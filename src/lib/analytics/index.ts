// First-party product analytics — opt-out, fire-and-forget, batched.
//
// NO PII in properties, EVER. Properties are small scalar tags only (e.g.
// feature_used { name: 'barcode' }) — never food names, weights, free text,
// emails or ids. user_id comes from the auth token server-side; the client
// never sends it. Events are which-feature-was-used signals, nothing more.
//
// track() never throws and never blocks UI. Events buffer in memory, flush in
// batches of ≤50 when the buffer reaches 20 (or on explicit flushAnalytics());
// a failed send keeps the batch (capped at 200, oldest dropped) and persists it
// to secure-store so events survive a restart. Opt-out (Settings → Privacy)
// makes track() a no-op and discards anything buffered.
import { api, type AnalyticsEventInput } from '@/lib/api';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { useSettingsStore } from '@/lib/settings/store';

export type AnalyticsEventName =
  | 'onboarding_completed'
  | 'food_logged'
  | 'scan_started'
  | 'scan_confirmed'
  | 'scan_corrected'
  | 'scan_discarded'
  | 'workout_logged'
  | 'template_created'
  | 'integration_connected'
  | 'paywall_viewed'
  | 'trial_started'
  | 'feature_used';

const ALLOWED = new Set<string>([
  'onboarding_completed',
  'food_logged',
  'scan_started',
  'scan_confirmed',
  'scan_corrected',
  'scan_discarded',
  'workout_logged',
  'template_created',
  'integration_connected',
  'paywall_viewed',
  'trial_started',
  'feature_used',
]);

const STORAGE_KEY = 'lumo.analytics.buffer';
const FLUSH_AT = 20; // auto-flush threshold
const MAX_BUFFER = 200; // cap; oldest dropped beyond this
const MAX_BATCH = 50; // API contract: max events per request

const newSessionId = () =>
  `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// One session id per app launch (module load).
let sessionId = newSessionId();
let buffer: AnalyticsEventInput[] = [];
let hydrated = false;
let flushing = false;

const enabled = () => useSettingsStore.getState().analyticsEnabled;

// persist/getItem swallow their own errors (secureStore wrapper) — best-effort.
async function persist(): Promise<void> {
  await setItem(STORAGE_KEY, JSON.stringify(buffer));
}

async function discardAll(): Promise<void> {
  buffer = [];
  await persist();
}

// Opt-out discards anything already buffered, immediately.
useSettingsStore.subscribe((s, prev) => {
  if (!s.analyticsEnabled && prev.analyticsEnabled) void discardAll();
});

/** Record one product event. Never throws, never blocks. */
export function track(
  name: AnalyticsEventName,
  properties?: Record<string, string | number | boolean>,
): void {
  try {
    if (!enabled()) {
      if (buffer.length > 0) void discardAll();
      return;
    }
    if (!ALLOWED.has(name)) {
      if (__DEV__) console.warn('[analytics] unknown event dropped:', name);
      return;
    }
    buffer.push({
      name,
      ...(properties ? { properties } : {}),
      session_id: sessionId,
      client_ts: new Date().toISOString(),
    });
    if (buffer.length > MAX_BUFFER) buffer = buffer.slice(buffer.length - MAX_BUFFER);
    if (buffer.length >= FLUSH_AT) void flushAnalytics();
  } catch {
    // analytics must never break the app
  }
}

/** Send buffered events (batches of ≤50). A failed send keeps the rest and
 *  persists the buffer for the next launch. Never throws. */
export async function flushAnalytics(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    if (!enabled()) {
      await discardAll();
      return;
    }
    while (buffer.length > 0) {
      const batch = buffer.slice(0, MAX_BATCH);
      await api.analytics.events(batch);
      buffer = buffer.slice(batch.length);
    }
    await persist(); // success → clear the persisted copy too
  } catch {
    await persist(); // send failed → keep events across a restart
  } finally {
    flushing = false;
  }
}

/** Hydrate the persisted opt-out + buffer (once) and attempt a flush. Call on
 *  launch, BEFORE anything can send: the settings store re-seeds to defaults on
 *  every launch, so the persisted privacy choice must be re-applied here. */
export async function initAnalytics(): Promise<void> {
  if (!hydrated) {
    hydrated = true;
    if ((await getItem(STORAGE_KEYS.analyticsEnabled)) === '0') {
      useSettingsStore.setState({ analyticsEnabled: false });
    }
    const raw = await getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) buffer = [...(parsed as AnalyticsEventInput[]), ...buffer];
      } catch {
        // corrupt payload → start clean
      }
    }
    if (!enabled()) buffer = [];
  }
  await flushAnalytics();
}

/** Buffered (unsent) event count — for tests. */
export function pendingCount(): number {
  return buffer.length;
}

/** Test helper — reset in-memory + persisted state, new session id. */
export async function __resetForTests(): Promise<void> {
  buffer = [];
  hydrated = false;
  flushing = false;
  sessionId = newSessionId();
  await setItem(STORAGE_KEY, JSON.stringify([]));
}

/** Test helper — drop in-memory state only (simulates an app restart; the
 *  persisted buffer survives and rehydrates on the next initAnalytics). */
export function __resetMemoryForTests(): void {
  buffer = [];
  hydrated = false;
  flushing = false;
  sessionId = newSessionId();
}
