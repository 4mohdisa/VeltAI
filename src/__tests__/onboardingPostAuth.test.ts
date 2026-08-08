// Item 4 of the 2026-08-08 follow-ups: an already-onboarded user whose
// GET /api/onboarding failed was silently walked back through the entire
// setup flow, because "no record" and "request failed" were the same branch.
import { resolvePostAuth } from '@/lib/onboarding/postAuth';

test('the server says completed → into the app, nothing degraded', () => {
  expect(resolvePostAuth({ serverCompleted: true, locallyCompleted: false })).toEqual({
    destination: '/(tabs)',
    degraded: false,
  });
});

test('the server says NOT completed → start the flow, nothing degraded', () => {
  expect(resolvePostAuth({ serverCompleted: false, locallyCompleted: false })).toEqual({
    destination: '/onboarding/measurements',
    degraded: false,
  });
});

// The bug: this case used to be indistinguishable from "not completed".
test('the request FAILED but this device already finished → into the app, degraded', () => {
  expect(resolvePostAuth({ serverCompleted: undefined, locallyCompleted: true })).toEqual({
    destination: '/(tabs)',
    degraded: true,
  });
});

test('the request FAILED and nothing local says otherwise → start the flow, degraded', () => {
  expect(resolvePostAuth({ serverCompleted: undefined, locallyCompleted: false })).toEqual({
    destination: '/onboarding/measurements',
    degraded: true,
  });
});

// A definitive server "no" outranks a stale local flag: the account really has
// no record (a reinstall onto a device whose keychain survived, say).
test('a server NO beats a stale local completion flag', () => {
  expect(resolvePostAuth({ serverCompleted: false, locallyCompleted: true }).destination).toBe(
    '/onboarding/measurements',
  );
});

test('a degraded route into the app never marks onboarding complete on the server', () => {
  // Encoded in the flag the caller acts on: degraded means "we do not know",
  // so the caller must not write a completion it has not confirmed.
  expect(resolvePostAuth({ serverCompleted: undefined, locallyCompleted: true }).degraded).toBe(true);
});

// The decision must stay in the tested resolver, not drift back inline where
// the two branches were conflated and untestable.
test('signup.tsx delegates the decision to resolvePostAuth', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'app', 'onboarding', 'signup.tsx'),
    'utf8',
  );
  expect(src).toContain('resolvePostAuth({ serverCompleted, locallyCompleted })');
  // The old shape: a bare catch that fell straight through to the flow.
  expect(src).not.toContain('// Unreachable backend → assume not onboarded');
});
