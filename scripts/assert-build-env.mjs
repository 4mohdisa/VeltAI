#!/usr/bin/env node
// Build-time configuration assertion.
//
// Runs as the `eas-build-pre-install` npm hook, so a cloud build that is
// missing a variable fails in the EAS log — before any compilation is spent
// and long before a tester installs an app with no auth and no purchase path.
//
// This is the build-time half of src/lib/config/requiredEnv.ts. Both lists are
// pinned to each other by a test, so they cannot drift.
//
// Only asserts for DISTRIBUTABLE profiles. `eas build --profile development`
// produces a dev client where the shims are legitimate.

const REQUIRED = [
  ['EXPO_PUBLIC_API_URL', 'the backend this build talks to'],
  ['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY', 'sign-in'],
  ['EXPO_PUBLIC_REVENUECAT_IOS_KEY', 'subscriptions'],
];

// EAS sets EAS_BUILD_PROFILE to the profile being built. Absent locally, where
// this script is only run deliberately.
const profile = process.env.EAS_BUILD_PROFILE ?? process.env.LUME_ASSERT_PROFILE ?? '';
const DEV_PROFILES = new Set(['development']);

if (profile && DEV_PROFILES.has(profile)) {
  console.log(`[assert-build-env] profile "${profile}" is a dev client — shims are expected, skipping.`);
  process.exit(0);
}

const problems = [];
for (const [name, purpose] of REQUIRED) {
  const value = (process.env[name] ?? '').trim();
  if (value === '') {
    problems.push(`${name} is not set — ${purpose} will not work.`);
    continue;
  }
  if (name === 'EXPO_PUBLIC_API_URL') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2)\b/i.test(value)) {
      problems.push(`${name} points at localhost (${value}) — a device cannot reach the build machine.`);
    } else if (!/^https:\/\//i.test(value)) {
      // iOS App Transport Security blocks plain http; the request would fail
      // on device with a misleading network error.
      problems.push(`${name} must be https (got ${value}) — iOS ATS blocks plain http.`);
    }
  }
}

// A test-mode build is the intended posture right now, so a pk_live_ key is
// worth flagging: it would point TestFlight at real users.
const clerk = (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '').trim();
if (clerk && !clerk.startsWith('pk_test_') && !clerk.startsWith('pk_live_')) {
  problems.push(`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY does not look like a Clerk key (expected pk_test_… or pk_live_…).`);
}

if (problems.length > 0) {
  console.error(`\n[assert-build-env] REFUSING TO BUILD profile "${profile || '(unknown)'}":\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error(
    '\nSet these as EAS environment variables (see TESTFLIGHT.md). A cloud build does NOT read your local .env.\n',
  );
  process.exit(1);
}

const shown = clerk.startsWith('pk_live_') ? 'LIVE' : 'test';
console.log(
  `[assert-build-env] ok — profile "${profile || '(local)'}", API ${process.env.EXPO_PUBLIC_API_URL}, Clerk ${shown} instance, debug capture ${process.env.EXPO_PUBLIC_DEBUG_CAPTURE === '1' ? 'ON' : 'off'}.`,
);
