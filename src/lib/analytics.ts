// First-party product analytics — OPT-IN, fire-and-forget, batched.
//
// NO PII in properties, EVER. Properties are small scalar tags only (e.g.
// feature_used { name: 'barcode' }) — never food names, weights, free text,
// emails or ids. user_id comes from the auth token server-side; the client
// never sends it. Events are which-feature-was-used signals, nothing more.
// That promise is now ENFORCED at runtime by sanitize() below, not just stated
// here and typed at compile time (the type is erased before anything ships).
//
// Consent: opt-in as of 2026-08-09 (DECISIONS.md). analyticsEnabled defaults to
// FALSE and nothing is collected until the user answers the consolidated
// disclosure in src/lib/ai/consent.ts. There is no new screen and no second
// prompt — one ask covers AI processing and usage analytics, and Settings →
// Privacy can turn either off independently afterwards.
//
// track() never throws and never blocks UI. Events buffer in memory, flush in
// batches of ≤50 when the buffer reaches 20 (or on explicit flushAnalytics());
// a failed send keeps the batch (capped at 200, oldest dropped) and persists it
// to secure-store so events survive a restart. Turning it off makes track() a
// no-op and discards anything buffered.
import { api, isTransient, type AnalyticsEventInput } from '@/lib/api';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage/secureStore';
import { useSettingsStore } from '@/lib/settings/store';
import { recordBreadcrumb } from '@/debug';
// Imported from the buffer module directly, NOT from '@/debug': the '@/debug'
// barrel no-ops every recorder when EXPO_PUBLIC_DEBUG_CAPTURE is off, and the
// redaction on the analytics path has to run in the shipping build too.
import { redact } from '@/debug/buffers';
import { APP_VERSION, BUILD_NUMBER, GIT_SHA } from '@/lib/appVersion';

export type AnalyticsEventName =
  | 'session_started'
  | 'onboarding_step_viewed'
  | 'onboarding_completed'
  | 'food_logged'
  | 'scan_started'
  | 'scan_completed'
  | 'scan_failed'
  | 'scan_confirmed'
  | 'scan_corrected'
  | 'scan_discarded'
  | 'workout_logged'
  | 'template_created'
  | 'integration_connected'
  | 'paywall_viewed'
  | 'purchase_started'
  | 'purchase_completed'
  | 'purchase_cancelled'
  | 'purchase_restored'
  | 'trial_started'
  | 'feature_used';

const ALLOWED = new Set<string>([
  'session_started',
  'onboarding_step_viewed',
  'onboarding_completed',
  'food_logged',
  'scan_started',
  'scan_completed',
  'scan_failed',
  'scan_confirmed',
  'scan_corrected',
  'scan_discarded',
  'workout_logged',
  'template_created',
  'integration_connected',
  'paywall_viewed',
  'purchase_started',
  'purchase_completed',
  'purchase_cancelled',
  'purchase_restored',
  'trial_started',
  'feature_used',
]);

const STORAGE_KEY = 'lume.analytics.buffer';
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

// Stamped onto every event so a funnel can be read per release, and so a
// regression can be pinned to the exact commit rather than "some 1.0.0 build".
// GIT_SHA is null when the build genuinely cannot know it — omitted rather than
// sent as a placeholder, matching src/lib/appVersion.ts.
const BUILD_TAGS: Record<string, string> = {
  app_version: APP_VERSION,
  build: BUILD_NUMBER,
  ...(GIT_SHA ? { git_sha: GIT_SHA } : {}),
};

const MAX_PROPS = 12;
const MAX_VALUE_CHARS = 64;
const KEY_OK = /^[a-z][a-z0-9_]{0,31}$/;
// A legitimate analytics value is a short scalar TAG — 'barcode', 'strava',
// 'step_3', '1.0.0', a commit sha. Anything with a space or an '@' is prose or
// an address, i.e. exactly the user content that must never leave the device.
// Allow-listing the shape is a stronger guarantee than chasing PII patterns.
const VALUE_OK = /^[A-Za-z0-9_.:+-]{1,64}$/;

/** Enforce the no-PII promise at runtime. Drops any key or value that is not a
 *  short scalar tag, and runs the debug system's credential redaction over what
 *  survives. Returns undefined when nothing is left, so the event still records
 *  (an event with a dropped property is far better than a lost event). */
export function sanitize(
  properties?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> | undefined {
  if (!properties) return undefined;
  const out: Record<string, string | number | boolean> = {};
  let n = 0;
  for (const [k, v] of Object.entries(properties)) {
    if (n >= MAX_PROPS || !KEY_OK.test(k)) continue;
    if (typeof v === 'boolean') {
      out[k] = v;
    } else if (typeof v === 'number') {
      if (!Number.isFinite(v)) continue;
      out[k] = v;
    } else if (typeof v === 'string') {
      // Redact first: a value that only becomes safe after redaction (a bearer
      // token) must not then be rejected for shape and silently retried later.
      const s = redact(v).slice(0, MAX_VALUE_CHARS);
      if (!VALUE_OK.test(s)) continue;
      out[k] = s;
    } else {
      continue; // objects, arrays, null, undefined — never a scalar tag
    }
    n++;
  }
  return n > 0 ? out : undefined;
}

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

/** Sign-out purge: drop the in-memory AND persisted buffer, and rotate the
 *  session id. Without this, user A's unsent events would flush under user B's
 *  JWT after an account switch (events carry no user id — the backend
 *  attributes from the verified token). Called from resetAllStores. */
export async function resetAnalytics(): Promise<void> {
  sessionId = newSessionId();
  await discardAll();
}

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
    const clean = sanitize(properties);
    // Debug capture reuses these events as its breadcrumb trail — one source
    // of truth, so a report's breadcrumbs cannot disagree with analytics.
    // Compiled out when EXPO_PUBLIC_DEBUG_CAPTURE is off.
    recordBreadcrumb(name, clean);
    buffer.push({
      name,
      properties: { ...BUILD_TAGS, ...clean },
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
      try {
        await api.analytics.events(batch);
      } catch (e) {
        // A permanent rejection (400 unknown event name, 413, …) is fatal for
        // THIS batch and will be fatal every time. Keeping it re-sent the same
        // doomed 50 events on every flush forever, and because track() flushes
        // whenever the buffer hits 20, every subsequent event issued another
        // failing POST against the shared 120/min write budget. Drop it and say
        // so. Transient failures (offline, 5xx, 429) still keep the batch.
        if (!isTransient(e)) {
          buffer = buffer.slice(batch.length);
          console.warn(`[analytics] dropped ${batch.length} event(s) — permanent rejection:`, e);
          continue;
        }
        throw e;
      }
      buffer = buffer.slice(batch.length);
    }
    await persist(); // success → clear the persisted copy too
  } catch (e) {
    // Silent to the USER, never silent in the logs — a funnel that has quietly
    // stopped reporting for a week is worse than no funnel at all.
    console.warn(`[analytics] flush failed, ${buffer.length} event(s) kept for retry:`, e);
    await persist(); // send failed → keep events across a restart
  } finally {
    flushing = false;
  }
}

/** Hydrate the persisted consent + buffer (once) and attempt a flush. Call on
 *  launch, BEFORE anything can send: the settings store re-seeds to defaults on
 *  every launch, so the persisted privacy choice must be re-applied here.
 *
 *  Opt-in: the store default is FALSE, so only an explicit stored '1' turns
 *  collection on. An absent key means the user has not answered yet — which
 *  must read as "no", not as "not opted out". */
export async function initAnalytics(): Promise<void> {
  if (!hydrated) {
    hydrated = true;
    // Authoritative in BOTH directions. Only a stored '1' enables; '0' and
    // absent both disable, and absent is the common case (never asked). Setting
    // false explicitly rather than leaving the store alone is what preserves
    // the pre-opt-in guarantee that a persisted refusal beats whatever the
    // in-memory store happens to hold after a re-seed.
    const stored = await getItem(STORAGE_KEYS.analyticsEnabled);
    useSettingsStore.setState({ analyticsEnabled: stored === '1' });
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
