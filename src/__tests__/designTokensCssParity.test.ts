// The web projection of the design tokens (.design-sync/tokens-pkg/tokens.css)
// is what claude.ai/design builds Lume mockups from. It is hand-maintained, so
// a token added to tokens.ts would silently never reach the design agent. This
// asserts every token key has a CSS custom property.
//
// tokens.ts is read as text rather than imported: it pulls in react-native,
// which the `node` jest project can't load.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '../..');
const src = readFileSync(join(root, 'src/lib/design/tokens.ts'), 'utf8');
const css = readFileSync(join(root, '.design-sync/tokens-pkg/tokens.css'), 'utf8');

const defined = new Set(Array.from(css.matchAll(/--lume-[a-z0-9-]+(?=\s*:)/g), (m) => m[0]));

/** Top-level keys of `export const <name> = { … } as const`. */
function keysOf(exportName: string): string[] {
  const start = src.indexOf(`export const ${exportName} = {`);
  expect(start).toBeGreaterThan(-1);
  const body = src.slice(start, src.indexOf('\n} as const', start));
  // Two-space indent = top level; deeper indent is a nested object (shadow, motion).
  return Array.from(body.matchAll(/^ {2}'?([A-Za-z0-9_]+)'?:/gm), (m) => m[1]);
}

// camelCase / 2xl → kebab: gray800 → gray-800, bodyMedium → body-medium, 2xl → 2xl.
const kebab = (k: string) =>
  k.replace(/([a-z])([A-Z0-9])/g, '$1-$2').replace(/([0-9])([a-z])/g, '$1$2').toLowerCase();

// Deprecated aliases in tokens.ts, deliberately not projected to the web.
const OMITTED = new Set(['gray900', 'gray700', 'gray600', 'gray300', 'gray200', 'gray150', 'gray100']);

const expectAll = (prefix: string, exportName: string, suffixes = ['']) => {
  const missing = keysOf(exportName)
    .filter((k) => !OMITTED.has(k))
    .flatMap((k) => suffixes.map((s) => `--lume-${prefix}-${kebab(k)}${s}`))
    .filter((name) => !defined.has(name));
  expect(missing).toEqual([]);
};

describe('design tokens → tokens.css parity', () => {
  it('exports every color, accent, category and surface token', () => {
    expectAll('color', 'color');
    expectAll('accent', 'accent');
    expectAll('category', 'categoryAccent');
    expectAll('surface', 'surface');
  });

  it('exports size, line-height and weight for every type variant', () => {
    expectAll('text', 'type', ['-size', '-line', '-weight']);
  });

  it('exports every spacing and radius step', () => {
    expectAll('space', 'space');
    expectAll('radius', 'radius');
  });
});
