// PostHog sink for product analytics (PHASE3_ROWS.md row 8, step 2a). PostHog
// starts only when EXPO_PUBLIC_POSTHOG_KEY is set: with no key there is no
// client and no network. The client keeps its own anonymous ID (identify() is
// never called), builds no person profiles, records no session replay, and
// sends no lifecycle events, feature flag calls or GeoIP lookups. send() only
// ever receives what analytics.ts has already passed through sanitize().
import type PostHog from 'posthog-react-native';

let client: PostHog | null = null;

export function initAnalyticsSink(): void {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
  if (!key || client) return;
  // Loaded only when a key exists, so a build without one never runs PostHog.
  const { default: PostHogClient } = require('posthog-react-native') as typeof import('posthog-react-native');
  // Optional region override (an EU project); unset keeps PostHog's default host.
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim();
  client = new PostHogClient(key, {
    ...(host ? { host } : {}),
    enableSessionReplay: false,
    captureAppLifecycleEvents: false,
    personProfiles: 'never',
    preloadFeatureFlags: false,
    disableGeoip: true,
    defaultOptIn: false,
  });
}

export function sendToSink(name: string, properties?: Record<string, string | number | boolean>): void {
  client?.capture(name, properties);
}

/** Mirror the user's analytics choice onto PostHog's own opt-out, so events it
 *  has already queued are not sent after the user turns analytics off. */
export function setSinkOptIn(enabled: boolean): void {
  if (!client) return;
  if (enabled) void client.optIn();
  else void client.optOut();
}

/** Sign-out: drop PostHog's anonymous ID and stored properties, so the next
 *  account on this phone starts with a fresh identity. */
export function resetSink(): void {
  client?.reset();
}

/** Test helper: forget the client so init can run again. */
export function __resetSinkForTests(): void {
  client = null;
}
