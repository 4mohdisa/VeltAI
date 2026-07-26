/// <reference types="node" />
// F2 — client-bundle secrets posture. EXPO_PUBLIC_* vars are inlined into the
// shipped JS bundle and are public by design; everything else must never be
// referenced (let alone hardcoded) client-side. This test walks the real src/
// tree so a future `process.env.CLERK_SECRET_KEY` in app code fails CI.
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__') continue; // tests may reference names (this file does)
      out.push(...walk(p));
    } else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(SRC).map((p) => ({ p, src: fs.readFileSync(p, 'utf8') }));

test('every process.env reference in client code is EXPO_PUBLIC_* (or NODE_ENV)', () => {
  const bad: string[] = [];
  for (const { p, src } of files) {
    for (const m of src.matchAll(/process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
      const name = m[1];
      if (!name.startsWith('EXPO_PUBLIC_') && name !== 'NODE_ENV') {
        bad.push(`${path.relative(SRC, p)}: process.env.${name}`);
      }
    }
  }
  expect(bad).toEqual([]);
});

test('no server-secret env names are referenced client-side', () => {
  const serverOnly = [
    'CLERK_SECRET_KEY',
    'CLERK_WEBHOOK_SECRET',
    'REVENUECAT_WEBHOOK_AUTH',
    'DATABASE_URL',
    'GEMINI_API_KEY',
    'ANTHROPIC_API_KEY',
    'INTEGRATION_ENCRYPTION_KEY',
    'SERVICE_ROLE',
  ];
  const bad: string[] = [];
  for (const { p, src } of files) {
    // Comments may legitimately MENTION these names (e.g. "503 when
    // GEMINI_API_KEY unset on the server") — only code references are a leak.
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    for (const name of serverOnly) {
      if (codeOnly.includes(name)) bad.push(`${path.relative(SRC, p)}: ${name}`);
    }
  }
  expect(bad).toEqual([]);
});

test('no hardcoded key material anywhere in src/', () => {
  // Clerk secret/publishable, svix, RevenueCat Apple key, Google API key,
  // Anthropic key, JWTs. Keys must come from env — even public ones.
  const patterns = [
    /sk_(live|test)_[A-Za-z0-9]{8,}/,
    /pk_(live|test)_[A-Za-z0-9]{8,}/,
    /whsec_[A-Za-z0-9+/=]{8,}/,
    /appl_[A-Za-z0-9]{12,}/,
    /AIza[0-9A-Za-z_-]{30,}/,
    /sk-ant-[A-Za-z0-9-]{8,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./, // JWT-shaped literal
  ];
  const bad: string[] = [];
  for (const { p, src } of files) {
    for (const re of patterns) {
      const m = src.match(re);
      if (m) bad.push(`${path.relative(SRC, p)}: ${m[0].slice(0, 12)}…`);
    }
  }
  expect(bad).toEqual([]);
});
