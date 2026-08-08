#!/usr/bin/env node
// Preflight — verify the whole configuration BEFORE spending a build.
//
//   npm run preflight
//
// An EAS build takes real time and a real queue slot, and a TestFlight cycle
// costs more than that. Every check here has failed for real at least once on
// this project: a backend answering from a three-day-old binary, a migration
// that could never apply, a debug_reports table that did not exist, an env var
// that only existed on someone's laptop.
//
// Rules: every check prints PASS or FAIL with a specific reason, nothing is
// silently skipped (a check that cannot run prints SKIP and says what is
// missing), and any FAIL exits non-zero.

import { execSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const results = [];
const pass = (name, detail = '') => results.push({ state: 'PASS', name, detail });
const fail = (name, detail) => results.push({ state: 'FAIL', name, detail });
const skip = (name, detail) => results.push({ state: 'SKIP', name, detail });

const env = (n) => (process.env[n] ?? '').trim();

// ── 1. Required app configuration ────────────────────────────────────────────
const REQUIRED = [
  ['EXPO_PUBLIC_API_URL', 'the backend this build talks to'],
  ['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY', 'sign-in'],
  ['EXPO_PUBLIC_REVENUECAT_IOS_KEY', 'subscriptions'],
];
for (const [name, purpose] of REQUIRED) {
  const v = env(name);
  if (!v) fail(name, `not set — ${purpose} will not work`);
  else pass(name, name.includes('KEY') ? `set (${v.slice(0, 8)}…)` : v);
}

const apiUrl = env('EXPO_PUBLIC_API_URL');
if (apiUrl) {
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)\b/i.test(apiUrl)) {
    fail('API URL reachable from a device', `${apiUrl} is localhost — a phone cannot reach your machine`);
  } else if (!/^https:\/\//i.test(apiUrl)) {
    fail('API URL scheme', `${apiUrl} is not https — iOS ATS blocks plain http`);
  } else {
    pass('API URL scheme', 'https, not localhost');
  }
}

// Test-mode posture: this run is deliberately a Clerk TEST instance.
const clerkKey = env('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
if (clerkKey) {
  if (clerkKey.startsWith('pk_test_')) pass('Clerk instance', 'test instance (pk_test_) — the intended posture');
  else if (clerkKey.startsWith('pk_live_')) fail('Clerk instance', 'pk_live_ — this build is meant to use the TEST instance');
  else fail('Clerk instance', 'key is neither pk_test_ nor pk_live_');
}

const rcKey = env('EXPO_PUBLIC_REVENUECAT_IOS_KEY');
if (rcKey && !rcKey.startsWith('appl_')) {
  fail('RevenueCat key', 'an iOS RevenueCat public SDK key starts with appl_');
} else if (rcKey) {
  pass('RevenueCat key', 'looks like an iOS SDK key');
}

// ── 2. Backend reachable, and SAYING WHICH BUILD it is ───────────────────────
async function checkBackend() {
  if (!apiUrl) return skip('Backend /health', 'EXPO_PUBLIC_API_URL not set');
  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/health`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return fail('Backend /health', `HTTP ${res.status}`);
    const body = await res.json();
    const data = body?.data ?? body;
    if (data?.status !== 'ok') return fail('Backend /health', `unexpected body: ${JSON.stringify(body).slice(0, 120)}`);

    const revision = data.revision;
    if (!revision || revision === 'unknown') {
      return fail(
        'Backend build identity',
        'the server does not report a git revision — it is an old binary predating the build-info change, exactly the stale-lumoserver failure',
      );
    }
    let head = '';
    try {
      head = execSync('git rev-parse HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      /* not a work tree */
    }
    if (head && revision !== head) {
      fail(
        'Backend matches this checkout',
        `server is running ${String(revision).slice(0, 12)}, this checkout is ${head.slice(0, 12)} — rebuild and redeploy`,
      );
    } else {
      pass('Backend build identity', `${String(revision).slice(0, 12)}${data.dirty ? ' (DIRTY — matches no commit)' : ''}`);
    }
    if (data.dirty) {
      fail('Backend built from a clean tree', 'the running binary was built with uncommitted changes');
    }
  } catch (e) {
    fail('Backend /health', `unreachable: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── 3. Database: migrations applied, debug_reports present ───────────────────
function psql(sql) {
  return execSync(`psql "${process.env.DATABASE_URL}" -tAc "${sql.replace(/"/g, '\\"')}"`, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .toString()
    .trim();
}

function checkDatabase() {
  if (!env('DATABASE_URL')) {
    return skip('Database', 'DATABASE_URL not set — cannot verify migrations or debug_reports');
  }
  try {
    execSync('command -v psql', { stdio: 'ignore' });
  } catch {
    return skip('Database', 'psql not installed');
  }

  // Every migration on disk must be recorded as applied.
  // NOTE: no early return on failure here — debug_reports is checked below
  // regardless, because "migrations table unreadable" and "the instrument the
  // testing fortnight depends on is missing" are separate things to know.
  let applied = null;
  try {
    applied = new Set(psql('SELECT version FROM schema_migrations').split('\n').filter(Boolean));
  } catch {
    fail(
      'Database migrations',
      'schema_migrations is unreadable or absent — this database was not set up with ./deploy/migrate.sh, so applied state is unknown',
    );
  }
  const onDisk = readdirSync(join(ROOT, 'supabase', 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .map((f) => f.replace(/\.sql$/, ''));
  const pending = applied === null ? [] : onDisk.filter((v) => !applied.has(v));
  if (applied === null) {
    // already reported above
  } else if (pending.length > 0) {
    fail('Database migrations', `${pending.length} pending: ${pending.join(', ')} — run ./deploy/migrate.sh apply`);
  } else {
    pass('Database migrations', `all ${onDisk.length} applied`);
  }

  // debug_reports specifically: the instrument the testing fortnight depends on.
  try {
    const exists = psql(
      "SELECT to_regclass('public.debug_reports') IS NOT NULL",
    );
    if (exists === 't') {
      const rls = psql(
        "SELECT relrowsecurity FROM pg_class WHERE relname = 'debug_reports'",
      );
      if (rls === 't') pass('debug_reports', 'exists, RLS enabled');
      else fail('debug_reports', 'exists but RLS is DISABLED');
    } else {
      fail(
        'debug_reports',
        'table does not exist — every debug report will fail to sync silently. Run ./deploy/migrate.sh apply',
      );
    }
  } catch (e) {
    fail('debug_reports', String(e).split('\n')[0]);
  }
}

// ── 4. Clerk reachable ───────────────────────────────────────────────────────
async function checkClerk() {
  if (!clerkKey) return skip('Clerk reachable', 'no publishable key');
  // The Frontend API host is base64-encoded into the publishable key.
  let host = '';
  try {
    const encoded = clerkKey.split('_')[2] ?? '';
    host = Buffer.from(encoded, 'base64').toString('utf8').replace(/\$$/, '');
  } catch {
    /* fall through */
  }
  if (!host || !host.includes('.')) {
    return fail('Clerk reachable', 'could not decode the Frontend API host from the publishable key');
  }
  try {
    const res = await fetch(`https://${host}/v1/environment?__clerk_api_version=2021-02-05`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) pass('Clerk reachable', host);
    else fail('Clerk reachable', `${host} returned HTTP ${res.status}`);
  } catch (e) {
    fail('Clerk reachable', `${host}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── 5. Build prerequisites ───────────────────────────────────────────────────
function checkBuildPrereqs() {
  if (existsSync(join(ROOT, 'ios'))) {
    // Not fatal, but a stale prebuild has shipped the wrong identity before.
    pass('ios/ tree', 'present — `expo prebuild --clean` regenerates it; it is gitignored');
  } else {
    pass('ios/ tree', 'absent — prebuild will generate it fresh');
  }
  const easPath = join(ROOT, 'eas.json');
  try {
    // eslint-disable-next-line no-undef
    const eas = JSON.parse(execSync(`cat "${easPath}"`).toString());
    const tf = eas.build?.testflight;
    if (!tf) fail('eas.json testflight profile', 'missing');
    else if (tf.distribution !== 'store') {
      fail('eas.json testflight profile', `distribution is "${tf.distribution}" — TestFlight only accepts "store"`);
    } else if (tf.env?.EXPO_PUBLIC_DEBUG_CAPTURE !== '1') {
      fail('eas.json testflight profile', 'debug capture is not enabled in this profile');
    } else {
      pass('eas.json testflight profile', 'store distribution, debug capture on, autoIncrement ' + (tf.autoIncrement ? 'on' : 'OFF'));
    }
    const prod = eas.build?.production;
    if (prod?.env?.EXPO_PUBLIC_DEBUG_CAPTURE) {
      fail('production profile', 'sets EXPO_PUBLIC_DEBUG_CAPTURE — a debug overlay in a store build is a 2.3.1 rejection');
    } else {
      pass('production profile', 'no debug capture');
    }
  } catch (e) {
    fail('eas.json', String(e).split('\n')[0]);
  }
}

// ── run ──────────────────────────────────────────────────────────────────────
const t0 = Date.now();
checkBuildPrereqs();
checkDatabase();
await checkBackend();
await checkClerk();

const width = Math.max(...results.map((r) => r.name.length));
console.log('\nLume preflight\n');
for (const r of results) {
  const mark = r.state === 'PASS' ? '  ok  ' : r.state === 'SKIP' ? ' skip ' : ' FAIL ';
  console.log(`${mark} ${r.name.padEnd(width)}  ${r.detail}`);
}
const failed = results.filter((r) => r.state === 'FAIL');
const skipped = results.filter((r) => r.state === 'SKIP');
console.log(
  `\n${results.length - failed.length - skipped.length} ok, ${skipped.length} skipped, ${failed.length} failed (${Date.now() - t0}ms)\n`,
);
if (skipped.length > 0) {
  console.log('Skipped checks verified NOTHING — set the variable named above and re-run before trusting this.\n');
}
process.exit(failed.length > 0 ? 1 : 0);
