// The one place that answers "is this build configured?".
//
// WHY THIS EXISTS (2026-08-09): several subsystems degraded to a dev shim when
// their key was absent — Clerk logged "running in local dev auth mode",
// RevenueCat logged "billing-disabled dev mode". That is correct on a laptop
// and catastrophic in TestFlight: the tester gets an app with no auth and no
// purchase path that otherwise looks like it works, and nothing says why.
//
// The rule: a DISTRIBUTABLE build (anything EAS produces for a device —
// `__DEV__` is false in every release build, including TestFlight) must refuse
// to run without its configuration, naming the exact variables. A local dev
// build keeps the shims.
//
// `scripts/assert-build-env.mjs` enforces the same list at BUILD time so the
// failure lands in CI output rather than on a tester's phone.

/** Variables a distributable build cannot function without. */
export const REQUIRED_PUBLIC_ENV = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
] as const;

export type RequiredEnvName = (typeof REQUIRED_PUBLIC_ENV)[number];

/** What each variable is for — used verbatim in the on-screen error. */
export const ENV_PURPOSE: Record<RequiredEnvName, string> = {
  EXPO_PUBLIC_API_URL: 'the backend this build talks to',
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'sign-in',
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'subscriptions',
};

/**
 * True in a build that will run on someone else's device.
 *
 * `__DEV__` is compiled in by Metro: true for `expo start` and dev clients,
 * FALSE for every release build — which is exactly what TestFlight ships. It
 * is undefined under jest, where we behave like dev so the suite can exercise
 * the shims.
 */
export function isDistributableBuild(): boolean {
  return typeof __DEV__ === 'undefined' ? false : !__DEV__;
}

/** Read one variable. Kept as an explicit map because Metro inlines
 *  `process.env.EXPO_PUBLIC_*` by literal name — a computed lookup is empty. */
function readEnv(name: RequiredEnvName): string {
  switch (name) {
    case 'EXPO_PUBLIC_API_URL':
      return process.env.EXPO_PUBLIC_API_URL ?? '';
    case 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY':
      return process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
    case 'EXPO_PUBLIC_REVENUECAT_IOS_KEY':
      return process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
  }
}

/**
 * Variables missing from THIS build. Always empty in a dev build — the shims
 * are legitimate there — and authoritative in a distributable one.
 */
export function missingRequiredEnv(): RequiredEnvName[] {
  if (!isDistributableBuild()) return [];
  return REQUIRED_PUBLIC_ENV.filter((name) => readEnv(name).trim() === '');
}

/**
 * A localhost API URL in a distributable build is the same class of mistake:
 * it points at the developer's laptop, iOS ATS blocks plain http anyway, and
 * every request fails with a network error that looks like a backend outage.
 */
export function apiUrlIsLocalhost(): boolean {
  if (!isDistributableBuild()) return false;
  const url = readEnv('EXPO_PUBLIC_API_URL');
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2)\b/i.test(url);
}

/** The configuration problems this build has, as sentences for a human. */
export function configurationErrors(): string[] {
  const out = missingRequiredEnv().map(
    (name) => `${name} is not set — ${ENV_PURPOSE[name]} will not work.`,
  );
  if (apiUrlIsLocalhost()) {
    out.push(
      'EXPO_PUBLIC_API_URL points at localhost — a build on a device cannot reach the developer machine.',
    );
  }
  return out;
}
