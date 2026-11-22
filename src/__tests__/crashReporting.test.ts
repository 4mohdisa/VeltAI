// PHASE3_ROWS.md row 7: Sentry starts only with EXPO_PUBLIC_SENTRY_DSN, and
// breadcrumbs and events leave the device without the user's values.
import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

import { initCrashReporting, scrubBreadcrumb, scrubEvent } from '@/lib/crashReporting';

jest.mock('@sentry/react-native', () => ({ init: jest.fn() }));

const init = Sentry.init as jest.Mock;
const ORIGINAL_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

beforeEach(() => {
  init.mockClear();
});

afterAll(() => {
  process.env.EXPO_PUBLIC_SENTRY_DSN = ORIGINAL_DSN;
});

test('with no DSN, Sentry is never set up', () => {
  delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  initCrashReporting();
  process.env.EXPO_PUBLIC_SENTRY_DSN = '   ';
  initCrashReporting();
  expect(init).not.toHaveBeenCalled();
});

test('with a DSN, Sentry starts without personal data and with both scrubbers', () => {
  process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://public@example.invalid/1';
  initCrashReporting();
  expect(init).toHaveBeenCalledTimes(1);
  expect(init).toHaveBeenCalledWith({
    dsn: 'https://public@example.invalid/1',
    sendDefaultPii: false,
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend: scrubEvent,
  });
});

test('a breadcrumb keeps only its type, category, level and time', () => {
  const crumb: Breadcrumb = {
    type: 'http',
    category: 'fetch',
    level: 'info',
    timestamp: 1700000000,
    message: 'Logged 2 eggs, 140 kcal',
    data: { url: '/api/food/search?q=eggs', weight_kg: 82 },
  };
  expect(scrubBreadcrumb(crumb)).toEqual({ type: 'http', category: 'fetch', level: 'info', timestamp: 1700000000 });
});

test('an event loses its user, extra, contexts and request', () => {
  const event: ErrorEvent = {
    type: undefined,
    event_id: 'abc',
    message: 'Render failed',
    user: { id: 'u1', email: 'someone@example.com' },
    extra: { calories: 2140, protein_g: 150 },
    contexts: { workout: { sets: 5, reps: 8 } },
    request: { url: '/api/food/search?q=eggs' },
  };
  expect(scrubEvent(event)).toEqual({ type: undefined, event_id: 'abc', message: 'Render failed' });
});
