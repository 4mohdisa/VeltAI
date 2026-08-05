/// <reference types="jest" />
/// <reference types="node" />
// The product is Lume. It has had three names at once — the bundle shipped as
// "Veltai", ~59 UI strings said "Lumo", and the real name was neither — which
// meant a reviewer installed one app, read another name on the launch screen,
// and was asked for camera access by a third. This suite fails if any of the
// dead names comes back into the app, the marketing site, or app.json.
//
// Same mechanism as noFabricatedData.test.ts: read the shipping source and
// assert on it, so a regression is caught by `npm test` rather than by someone
// noticing a permission prompt on a device.
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const repoRoot = join(__dirname, '..', '..');

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'out', 'dist', '.expo', 'ios', 'android']);
const TEXT_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.css', '.md']);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      walk(p, acc);
      continue;
    }
    const dot = entry.lastIndexOf('.');
    if (dot >= 0 && TEXT_EXT.has(entry.slice(dot))) acc.push(p);
  }
  return acc;
}

// The one deliberate exception: lumofit@gmail.com is a real mailbox that
// actually receives support email. Renaming it would send support into a void.
// See DECISIONS.md and RELEASE_PREP.md.
const ALLOWED = /lumofit@gmail\.com/g;

const DEAD_NAMES = /veltai|lumo/gi;

function offendingLines(file: string): string[] {
  const text = readFileSync(file, 'utf8').replace(ALLOWED, '');
  const out: string[] = [];
  text.split('\n').forEach((line, i) => {
    if (DEAD_NAMES.test(line)) out.push(`${file.replace(repoRoot + '/', '')}:${i + 1}: ${line.trim()}`);
    DEAD_NAMES.lastIndex = 0;
  });
  return out;
}

describe('the product is called Lume, everywhere', () => {
  test.each(['src', 'web'])('no dead product name survives in %s/', (dir) => {
    const offenders = walk(join(repoRoot, dir))
      // This file necessarily contains the patterns it searches for.
      .filter((f) => !f.endsWith('productName.test.ts'))
      .flatMap(offendingLines);
    expect(offenders).toEqual([]);
  });

  test('app.json carries the Lume identity', () => {
    const app = JSON.parse(readFileSync(join(repoRoot, 'app.json'), 'utf8')).expo;
    expect(app.name).toBe('Lume');
    expect(app.slug).toBe('lume');
    expect(app.scheme).toBe('lume');
    // Reverse-DNS of lume.fit, the domain the product actually owns.
    expect(app.ios.bundleIdentifier).toBe('fit.lume.app');
    expect(JSON.stringify(app)).not.toMatch(/veltai|lumo/i);
  });

  test('the permission strings a user reads name Lume', () => {
    const app = JSON.parse(readFileSync(join(repoRoot, 'app.json'), 'utf8')).expo;
    // This is the string iOS shows in the camera alert. It said "Veltai" while
    // the in-app rationale one tap earlier said "Lumo".
    expect(app.ios.infoPlist.NSCameraUsageDescription).toContain('Lume');
    const camera = app.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-camera');
    expect(camera[1].cameraPermission).toContain('Lume');
  });

  test('the app and web package names are Lume', () => {
    expect(JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).name).toBe('lume');
    expect(JSON.parse(readFileSync(join(repoRoot, 'web/package.json'), 'utf8')).name).toBe('lume-web');
  });

  test('secure-store keys share the lume prefix', () => {
    const src = readFileSync(join(repoRoot, 'src/lib/storage/secureStore.ts'), 'utf8');
    const keys = [...src.matchAll(/'([a-z]+)\.[A-Za-z]+'/g)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(0);
    expect([...new Set(keys)]).toEqual(['lume']);
  });

  test('the support mailbox is left alone on purpose', () => {
    // Deliberate exception, asserted so nobody "tidies" it into a dead address.
    const site = readFileSync(join(repoRoot, 'web/lib/site.ts'), 'utf8');
    expect(site).toContain('lumofit@gmail.com');
  });
});
