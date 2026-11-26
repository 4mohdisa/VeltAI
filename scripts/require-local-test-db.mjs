#!/usr/bin/env node
/**
 * `node scripts/require-local-test-db.mjs <step>` exits 1 unless
 * LUME_TEST_DATABASE_URL is set and its host is localhost or 127.0.0.1, so the
 * backend's real-database tests in that verify step cannot skip silently or
 * reach a hosted database. The URL itself is never printed.
 */
const step = process.argv[2] ?? 'this step';
const url = process.env.LUME_TEST_DATABASE_URL;
if (!url) {
  console.error(`${step} needs LUME_TEST_DATABASE_URL: set it to the local lume_test_local database on localhost or 127.0.0.1.`);
  process.exit(1);
}
let host = '';
try {
  host = new URL(url).hostname;
} catch {}
if (!['localhost', '127.0.0.1'].includes(host)) {
  console.error(`${step} refuses LUME_TEST_DATABASE_URL: its host must be localhost or 127.0.0.1.`);
  process.exit(1);
}
