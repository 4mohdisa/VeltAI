// The two scripts that stand between a misconfiguration and a wasted build /
// a wasted TestFlight cycle (Parts 1 and 5 of the 2026-08-09 run).
//
// Both are executed for real here — a script that is never run is a script
// that silently stops working.
import { execFileSync } from 'child_process';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', '..');

function run(script: string, env: Record<string, string | undefined>): { code: number; out: string } {
  // Start from a clean slate so the developer's own shell cannot mask a
  // missing variable.
  const base = { ...process.env };
  for (const k of ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY', 'EXPO_PUBLIC_REVENUECAT_IOS_KEY', 'DATABASE_URL', 'EAS_BUILD_PROFILE', 'LUME_ASSERT_PROFILE']) {
    delete base[k];
  }
  try {
    const out = execFileSync('node', [path.join(ROOT, 'scripts', script)], {
      env: { ...base, ...env } as NodeJS.ProcessEnv,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? 1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

describe('assert-build-env (build-time gate)', () => {
  test('a distributable profile with nothing set REFUSES the build and names each variable', () => {
    const { code, out } = run('assert-build-env.mjs', { LUME_ASSERT_PROFILE: 'testflight' });
    expect(code).toBe(1);
    expect(out).toContain('REFUSING TO BUILD');
    expect(out).toContain('EXPO_PUBLIC_API_URL');
    expect(out).toContain('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
    expect(out).toContain('EXPO_PUBLIC_REVENUECAT_IOS_KEY');
  });

  test('a localhost API URL is refused — a device cannot reach the build machine', () => {
    const { code, out } = run('assert-build-env.mjs', {
      LUME_ASSERT_PROFILE: 'testflight',
      EXPO_PUBLIC_API_URL: 'http://localhost:8080',
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_x',
      EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_x',
    });
    expect(code).toBe(1);
    expect(out).toContain('localhost');
  });

  test('plain http is refused — iOS ATS blocks it', () => {
    const { code, out } = run('assert-build-env.mjs', {
      LUME_ASSERT_PROFILE: 'testflight',
      EXPO_PUBLIC_API_URL: 'http://api.lume.fit',
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_x',
      EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_x',
    });
    expect(code).toBe(1);
    expect(out).toContain('ATS');
  });

  test('a fully configured profile passes', () => {
    const { code } = run('assert-build-env.mjs', {
      LUME_ASSERT_PROFILE: 'testflight',
      EXPO_PUBLIC_API_URL: 'https://api.lume.fit',
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_x',
      EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_x',
    });
    expect(code).toBe(0);
  });

  test('the development profile is skipped — a dev client is where shims belong', () => {
    const { code, out } = run('assert-build-env.mjs', { LUME_ASSERT_PROFILE: 'development' });
    expect(code).toBe(0);
    expect(out).toContain('skipping');
  });
});

describe('preflight', () => {
  test('missing configuration fails, and every skipped check says what it skipped', () => {
    const { code, out } = run('preflight.mjs', {});
    expect(code).toBe(1);
    expect(out).toContain('EXPO_PUBLIC_API_URL');
    // A skip must never read as a pass.
    expect(out).toContain('Skipped checks verified NOTHING');
  });

  test('it verifies the eas.json testflight profile is store distribution', () => {
    const { out } = run('preflight.mjs', {});
    expect(out).toContain('eas.json testflight profile');
    expect(out).toContain('store distribution');
  });

  test('it refuses a pk_live_ key — this build is meant to be the test instance', () => {
    const { code, out } = run('preflight.mjs', {
      EXPO_PUBLIC_API_URL: 'https://api.lume.fit',
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_abc',
      EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_x',
    });
    expect(code).toBe(1);
    expect(out).toContain('TEST instance');
  });
});
