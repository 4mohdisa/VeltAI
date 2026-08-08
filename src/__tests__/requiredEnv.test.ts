// Fail-open configuration (Part 1 of the 2026-08-09 TestFlight run).
//
// The app used to degrade to dev shims whenever a key was absent: Clerk logged
// "running in local dev auth mode", RevenueCat logged "billing-disabled dev
// mode". Correct on a laptop; in TestFlight it ships an app with no auth and
// no purchase path that otherwise looks like it works.
import {
  REQUIRED_PUBLIC_ENV,
  ENV_PURPOSE,
  isDistributableBuild,
  missingRequiredEnv,
  apiUrlIsLocalhost,
  configurationErrors,
} from '@/lib/config/requiredEnv';

const g = globalThis as { __DEV__?: boolean };
const setBuild = (dev: boolean) => {
  g.__DEV__ = dev;
};
afterEach(() => {
  delete g.__DEV__;
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
});

test('a dev build keeps its shims — nothing is reported missing', () => {
  setBuild(true);
  expect(isDistributableBuild()).toBe(false);
  expect(missingRequiredEnv()).toEqual([]);
  expect(configurationErrors()).toEqual([]);
});

test('a distributable build with NOTHING set names every missing variable', () => {
  setBuild(false);
  expect(isDistributableBuild()).toBe(true);
  expect(missingRequiredEnv()).toEqual([...REQUIRED_PUBLIC_ENV]);
  const errors = configurationErrors();
  // Each message names its variable — "packaged without its authentication
  // keys" did not tell anyone WHICH key to set.
  for (const name of REQUIRED_PUBLIC_ENV) {
    expect(errors.some((e) => e.includes(name))).toBe(true);
  }
});

test('RevenueCat is covered — a build with no purchase path must not ship silently', () => {
  setBuild(false);
  process.env.EXPO_PUBLIC_API_URL = 'https://api.lume.fit';
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_abc';
  expect(missingRequiredEnv()).toEqual(['EXPO_PUBLIC_REVENUECAT_IOS_KEY']);
});

test('a localhost API URL in a distributable build is a configuration error', () => {
  setBuild(false);
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8080';
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_abc';
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'appl_abc';
  expect(apiUrlIsLocalhost()).toBe(true);
  expect(configurationErrors().some((e) => e.includes('localhost'))).toBe(true);
});

test('a fully configured distributable build reports no problems', () => {
  setBuild(false);
  process.env.EXPO_PUBLIC_API_URL = 'https://api.lume.fit';
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_abc';
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'appl_abc';
  expect(configurationErrors()).toEqual([]);
});

test('every required variable explains itself', () => {
  for (const name of REQUIRED_PUBLIC_ENV) {
    expect(ENV_PURPOSE[name]).toBeTruthy();
  }
});

// The runtime list and the BUILD-time list must not drift: a variable enforced
// on device but not at build time still reaches a tester's phone.
test('the build-time assertion checks exactly the same variables', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const script = fs.readFileSync(
    path.join(__dirname, '..', '..', 'scripts', 'assert-build-env.mjs'),
    'utf8',
  );
  for (const name of REQUIRED_PUBLIC_ENV) {
    expect(script).toContain(name);
  }
});

test('the root layout gates on the shared list, not on ad-hoc per-key checks', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');
  const layout = fs.readFileSync(path.join(__dirname, '..', 'app', '_layout.tsx'), 'utf8');
  expect(layout).toContain('configurationErrors()');
  // The old copy named no variable and covered neither RevenueCat nor a
  // localhost API URL.
  expect(layout).not.toContain('packaged without its authentication keys');
  expect(layout).not.toContain('packaged without a server address');
});
