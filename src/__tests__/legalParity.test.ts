/// <reference types="jest" />
/// <reference types="node" />
/* Legal document parity.
   ==========================================================================

   The section STRUCTURE of Lume's legal documents is canonical in
   legal/manifest.json. Two surfaces implement it — the in-app screens here and
   the marketing site at web/lib/legal.ts — and they must not drift.

   Why two copies rather than one shared module: the packages deliberately have
   no cross-imports (README.md, "Each package builds, tests and deploys on its
   own"). The app bundles through Metro and the site through Next; a shared
   runtime module would couple them. The manifest is read only by checks, never
   bundled — the same pattern backend/tests/migrations already uses to read
   ../supabase/migrations. Duplication that a test enforces beats an import that
   breaks an architectural rule.

   The website half of this contract is enforced by web/scripts/check-legal.mjs. */
import { readFileSync } from 'fs';
import { join } from 'path';

const REPO = join(__dirname, '..', '..');
const manifest = JSON.parse(readFileSync(join(REPO, 'legal/manifest.json'), 'utf8')) as {
  lastUpdated: string;
  privacy: { sections: { id: string; heading: string }[] };
  terms: { sections: { id: string; heading: string }[] };
};

/** Headings, in order, as the screen declares them. */
function headingsOf(file: string): string[] {
  const src = readFileSync(join(REPO, 'src/app/legal', file), 'utf8');
  return [...src.matchAll(/^\s{4}heading: '((?:[^'\\]|\\.)*)',$/gm)].map((m) =>
    m[1].replace(/\\'/g, "'"),
  );
}

/** Manifest headings are sentence-case; compare case-insensitively so a
 *  capitalisation choice on one surface is not treated as drift. */
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

describe('in-app legal screens match the canonical section list', () => {
  test.each([
    ['privacy.tsx', 'privacy'],
    ['terms.tsx', 'terms'],
  ] as const)('%s implements every manifest section, in order', (file, key) => {
    const expected = manifest[key].sections.map((s) => norm(s.heading));
    const actual = headingsOf(file).map(norm);

    // Named diffs first — a bare array mismatch is unreadable at 16 entries.
    expect(expected.filter((h) => !actual.includes(h))).toEqual([]); // missing
    expect(actual.filter((h) => !expected.includes(h))).toEqual([]); // not in manifest
    expect(actual).toEqual(expected); // and in the same order
  });

  test('the visible date comes from the manifest', () => {
    for (const file of ['privacy.tsx', 'terms.tsx']) {
      const src = readFileSync(join(REPO, 'src/app/legal', file), 'utf8');
      expect(src).toContain(`const UPDATED = '${manifest.lastUpdated}'`);
    }
  });
});

describe('the in-app legal screens make no unsupported claim', () => {
  const sources = ['privacy.tsx', 'terms.tsx'].map((f) => ({
    f,
    src: readFileSync(join(REPO, 'src/app/legal', f), 'utf8'),
  }));

  // Body strings only — the file header comments explain why these are banned
  // and would otherwise trip the check.
  const bodyOf = (src: string) =>
    src
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .join('\n');

  test('no subscription price is stated (none is configured in App Store Connect)', () => {
    for (const { f, src } of sources) {
      expect({ file: f, matches: bodyOf(src).match(/US\$\s?\d|\$\d+\.\d{2}/g) }).toEqual({
        file: f,
        matches: null,
      });
    }
  });

  test('the server-side consent record IS described (it exists on this branch)', () => {
    // Inverted 2026-08-09. This guard was written when consent lived only on the
    // device, and it forbade claiming a server-side record because that would
    // have been a false representation. Migration 20260731000001 added
    // profiles.ai_consent_at and the backend now refuses every provider send
    // without it (403 ai_consent_required) — verified against the live database
    // on 2026-08-09. The false representation is now the OTHER direction:
    // describing consent as device-only understates where it is enforced, and a
    // reader deciding whether to accept is entitled to know a background job
    // honours it. The guard therefore asserts the claim is present, not absent.
    const privacy = sources.find((s) => s.f.includes('privacy'));
    expect(privacy).toBeDefined();
    expect(bodyOf(privacy!.src)).toMatch(/on our server/i);
  });

  test('voice logging is not described (the feature was removed)', () => {
    for (const { f, src } of sources) {
      expect({ file: f, hit: /\bvoice\b/i.test(bodyOf(src)) }).toEqual({ file: f, hit: false });
    }
  });

  test('the trial length derives from TRIAL_DAYS, never a hardcoded number', () => {
    const terms = readFileSync(join(REPO, 'src/app/legal/terms.tsx'), 'utf8');
    expect(terms).toContain('TRIAL_DAYS');
    expect(bodyOf(terms)).not.toMatch(/\b\d+-day free trial\b/);
  });
});

describe('Terms and Privacy are reachable without an account', () => {
  // App Store 3.1.2 and 5.1.1: both documents must be reachable before a user
  // has signed up, and from the paywall before any purchase action.
  test.each([
    ['sign-up', 'src/app/onboarding/signup.tsx'],
    ['paywall', 'src/app/onboarding/paywall.tsx'],
  ])('%s links to both documents', (_label, file) => {
    const src = readFileSync(join(REPO, file), 'utf8');
    expect(src).toContain('/legal/terms');
    expect(src).toContain('/legal/privacy');
  });

  test('the legal routes are not behind an auth gate', () => {
    // The app has no route-level auth guard on /legal/*; sign-up itself renders
    // them, which is only possible pre-authentication.
    const layout = readFileSync(join(REPO, 'src/app/_layout.tsx'), 'utf8');
    expect(layout).not.toMatch(/legal.*requireAuth|requireAuth.*legal/);
  });
});
