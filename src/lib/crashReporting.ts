// Crash reporting (PHASE3_ROWS.md row 7). Sentry starts only when
// EXPO_PUBLIC_SENTRY_DSN is set: with no DSN there is no setup and no network.
// Nothing the user logged may leave the device, so every breadcrumb keeps only
// its type, category, level and time, and every event loses its user, extra,
// contexts and request. Source map upload is an owner step (config plugin and
// SENTRY_AUTH_TOKEN), not done here.
import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

export function scrubBreadcrumb({ type, category, level, timestamp }: Breadcrumb): Breadcrumb {
  return { type, category, level, timestamp };
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const scrubbed = { ...event };
  delete scrubbed.user;
  delete scrubbed.extra;
  delete scrubbed.contexts;
  delete scrubbed.request;
  return scrubbed;
}

export function initCrashReporting(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend: scrubEvent,
  });
}
