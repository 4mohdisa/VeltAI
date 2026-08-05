/// <reference types="jest" />
/// <reference types="node" />
// The debug-capture system must NEVER reach the App Store.
//
// Two independent reasons: a debug overlay in a shipped app is a 2.3.1
// hidden-feature rejection, and these reports contain screenshots of a health
// app. So this file pins the gating itself, not the feature.
//
// __DEV__ is FALSE in TestFlight builds, so it cannot be the gate — the system
// has to run in exactly the build __DEV__ excludes. The gate is
// EXPO_PUBLIC_DEBUG_CAPTURE, set on internal profiles only.
import { readFileSync } from 'fs';
import { join } from 'path';

const repoRoot = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(repoRoot, p), 'utf8');

describe('the production build profile cannot enable debug capture', () => {
  const eas = JSON.parse(read('eas.json')) as {
    build: Record<string, { env?: Record<string, string>; distribution?: string }>;
  };

  test('production sets no EXPO_PUBLIC_DEBUG_CAPTURE', () => {
    const env = eas.build.production.env ?? {};
    expect(env.EXPO_PUBLIC_DEBUG_CAPTURE).toBeUndefined();
  });

  test('production is the only store-distributed profile, and it is clean', () => {
    for (const [name, profile] of Object.entries(eas.build)) {
      if (profile.distribution === 'store') {
        expect(`${name}:${profile.env?.EXPO_PUBLIC_DEBUG_CAPTURE ?? 'unset'}`).toBe(`${name}:unset`);
      }
    }
  });

  test('the profiles that DO enable it are internal-only', () => {
    for (const [name, profile] of Object.entries(eas.build)) {
      if (profile.env?.EXPO_PUBLIC_DEBUG_CAPTURE === '1') {
        expect(`${name}:${profile.distribution}`).toBe(`${name}:internal`);
      }
    }
  });
});

describe('the debug tree is excluded at the module boundary, not just hidden', () => {
  test('metro resolves src/debug/impl to the stub when the flag is off', () => {
    // Folding `if (false)` away still leaves the require() edges, so the UI and
    // its screenshot dependency would be bundled — unreachable, but present.
    // The resolver rule is what actually keeps them out of the graph.
    const metro = read('metro.config.js');
    expect(metro).toContain('EXPO_PUBLIC_DEBUG_CAPTURE');
    expect(metro).toContain('resolveRequest');
    expect(metro).toMatch(/src\/debug\/stub/);
  });

  test('the stub exports everything the impl does, so call sites need no branch', () => {
    const stub = read('src/debug/stub.ts');
    for (const name of [
      'DebugRoot',
      'DebugTag',
      'onApiCall',
      'onBreadcrumb',
      'onApiFailure',
      'onErrorBoundary',
      'setDebugAuthSnapshot',
      'setDebugEntitlementSnapshot',
    ]) {
      expect(stub).toContain(`export const ${name}`);
    }
  });

  test('shipping code imports only the gated entry point, never impl directly', () => {
    // Real import/require statements only — a mention in a comment is not a
    // dependency edge, and this file necessarily names the path it is policing.
    const { execSync } = require('child_process') as typeof import('child_process');
    const out = execSync(
      "grep -rnE \"(from|require\\\\()\\\\s*['\\\"][^'\\\"]*debug/impl\" src --include='*.ts' --include='*.tsx' || true",
      { cwd: repoRoot, encoding: 'utf8' },
    );
    const offenders = out
      .split('\n')
      .filter(Boolean)
      // src/debug/index.ts IS the boundary; files inside impl/ import each other.
      .filter((l) => !l.startsWith('src/debug/index.ts') && !l.startsWith('src/debug/impl/'))
      // Tests may import impl deliberately — they are not shipped.
      .filter((l) => !l.startsWith('src/__tests__/'));
    expect(offenders).toEqual([]);
  });

  test('the flag is a build-time constant, not a runtime toggle', () => {
    const flag = read('src/debug/flag.ts');
    expect(flag).toContain("process.env.EXPO_PUBLIC_DEBUG_CAPTURE === '1'");
    // No setter, no mutable state — nothing a shipped binary could flip.
    expect(flag).not.toMatch(/\blet\b|\bexport function set/);
  });

  test('the debug UI is absent when the flag is off', () => {
    // The overlay is the single mount point; with the flag off it renders null
    // before touching anything from impl.
    const overlay = read('src/debug/DebugOverlay.tsx');
    expect(overlay).toContain('if (!DEBUG_CAPTURE) return null;');
    // And in the jest environment the flag IS off, so the entry points no-op.
    jest.resetModules();
    const debug = require('@/debug');
    expect(debug.DEBUG_CAPTURE).toBe(false);
    expect(debug.recordApiCall({ method: 'GET', path: '/x', status: 200, durationMs: 1 })).toBeUndefined();
    expect(debug.reportCrash(new Error('x'))).toBeUndefined();
  });
});
