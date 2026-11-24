// PHASE4_ROWS.md row 29: scripts/secrets-scan.mjs, executed for real on fixture
// files in a temp folder. Every fake key is built at runtime from random
// characters and concatenated prefixes, so no secret-shaped literal sits in the
// repo for the scan itself to find.
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'secrets-scan.mjs');
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

function random(length: number): string {
  return Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
}

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'lume-secrets-scan-'));
});
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

function scan(name: string, content: string): { code: number; out: string } {
  const file = path.join(dir, name);
  writeFileSync(file, content);
  try {
    const out = execFileSync('node', [SCRIPT, file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? 1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

test('a clean file passes', () => {
  const { code, out } = scan('clean.ts', "export const greeting = 'hello';\nconst limit = 30;\n");
  expect(code).toBe(0);
  expect(out).toContain('no findings');
});

const secretName = 'CLERK_' + 'SECRET_KEY';
const cases: [string, string, string][] = [
  ['Clerk secret key', 'clerk.ts', `const k = '${'sk_' + 'live_' + random(32)}';`],
  ['Anthropic key', 'anthropic.ts', `const k = '${'sk-' + 'ant-' + random(40)}';`],
  ['Google API key', 'google.ts', `const k = '${'AI' + 'za' + random(35)}';`],
  ['PEM private key', 'key.pem', `${'-----BEGIN ' + 'RSA PRIVATE KEY-----'}\n${random(64)}\n`],
  ['secret-named literal', 'config.ts', `const ${secretName} = '${random(24)}';`],
  ['secret-named literal', 'local.env', `${secretName}=${random(24)}\n`],
];

test.each(cases)('flags a %s by file and line, never printing the value', (rule, name, content) => {
  const { code, out } = scan(name, `// header\n${content}\n`);
  expect(code).toBe(1);
  expect(out).toContain(`${name}:2 ${rule}`);
  const value = content.match(/[A-Za-z]{24,}/)?.[0];
  expect(value).toBeDefined();
  expect(out).not.toContain(value);
});

test('env references, interpolation, empty values and placeholders are not flagged', () => {
  const { code, out } = scan(
    'refs.env',
    [
      `${secretName}=`,
      `${secretName}=$` + '{CLERK_KEY_FROM_VAULT}',
      `const ${secretName} = process.env.${secretName};`,
      `const API_KEY = '$` + "{fromEnvironment}';",
      `${secretName}=${'sk_' + 'live_'}REPLACE_WITH_YOUR_KEY`,
    ].join('\n'),
  );
  expect(code).toBe(0);
  expect(out).toContain('no findings');
});
