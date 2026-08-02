/* Legal scaffold checker.  `npm run check:legal`
   ==========================================================================

   Three jobs:
     1. Structure — every section in legal/manifest.json is implemented by the
        web pages, in order, with matching ids. Nothing extra, nothing missing.
     2. Completeness — count remaining TODO blocks and print them as a
        checklist of what still has to be supplied.
     3. A gate — exit 1 while ANY TODO remains, so a half-written policy cannot
        be deployed as though it were done.

   It is deliberately SEPARATE from `npm run check`, and deliberately NOT in
   `npm run verify`. Those must stay green for ordinary work; this one is
   expected to fail until a lawyer has been engaged, and a check that is
   expected to fail cannot live in the chain that gates every commit — it would
   be muted within a day. `npm run verify` prints a reminder to run it.
*/
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(ROOT, '..');

const manifest = JSON.parse(readFileSync(join(REPO, 'legal/manifest.json'), 'utf8'));
const source = readFileSync(join(ROOT, 'lib/legal.ts'), 'utf8');

let failures = 0;
const fail = (m) => { failures++; console.log(`  FAIL  ${m}`); };
const ok = (m) => console.log(`  ok    ${m}`);

/* ---- 1. structure -------------------------------------------------------- */

/** Pull the ordered section ids implemented for a given exported const. */
function implementedIds(constName) {
  const start = source.indexOf(`export const ${constName}: Section[] = [`);
  if (start === -1) return null;
  // The next `export ` at column 0 ends the array.
  const rest = source.slice(start + 1);
  const end = rest.indexOf('\nexport ');
  const body = end === -1 ? rest : rest.slice(0, end);
  return [...body.matchAll(/^\s{4}id: '([^']+)'/gm)].map((m) => m[1]);
}

console.log('\nstructure — web pages vs legal/manifest.json');

// The date is duplicated (see lib/legal.ts) because the site cannot import from
// outside its package root. This is the assertion that keeps it honest.
{
  const m = source.match(/export const LAST_UPDATED = '([^']+)'/);
  if (!m) fail('lib/legal.ts: no LAST_UPDATED constant found');
  else if (m[1] !== manifest.lastUpdated)
    fail(`lastUpdated drift — manifest says "${manifest.lastUpdated}", lib/legal.ts says "${m[1]}"`);
  else ok(`lastUpdated matches the manifest (${m[1]})`);
}
const docs = [
  { key: 'privacy', constName: 'PRIVACY', label: 'Privacy policy' },
  { key: 'terms', constName: 'TERMS', label: 'Terms of service' },
];

for (const doc of docs) {
  const expected = manifest[doc.key].sections.map((s) => s.id);
  const actual = implementedIds(doc.constName);
  if (!actual) { fail(`${doc.label}: could not find "export const ${doc.constName}" in lib/legal.ts`); continue; }

  const missing = expected.filter((id) => !actual.includes(id));
  const extra = actual.filter((id) => !expected.includes(id));
  if (missing.length) fail(`${doc.label}: missing section(s) — ${missing.join(', ')}`);
  if (extra.length) fail(`${doc.label}: section(s) not in the manifest — ${extra.join(', ')}`);
  if (!missing.length && !extra.length && expected.join('|') !== actual.join('|')) {
    fail(`${doc.label}: sections are out of order\n        manifest: ${expected.join(', ')}\n        page:     ${actual.join(', ')}`);
  }
  if (!missing.length && !extra.length && expected.join('|') === actual.join('|')) {
    ok(`${doc.label}: all ${expected.length} sections implemented, in order`);
  }
}

/* ---- 2. completeness ----------------------------------------------------- */

/** Section id → its TODO texts, by walking the source in order. */
function todosBySection(constName) {
  const start = source.indexOf(`export const ${constName}: Section[] = [`);
  const rest = source.slice(start + 1);
  const end = rest.indexOf('\nexport ');
  const body = end === -1 ? rest : rest.slice(0, end);

  const out = [];
  let current = null;
  // Match either a section id or the opening of a todo(...) call, in order.
  for (const m of body.matchAll(/^\s{4}id: '([^']+)'|(\btodo\()/gm)) {
    if (m[1]) { current = { id: m[1], count: 0, first: '' }; out.push(current); }
    else if (current) {
      current.count++;
      if (!current.first) {
        // First sentence of the placeholder, for the checklist. The argument is
        // one or more single-quoted strings joined by `+`, so collect the quoted
        // runs and stop at the closing paren — otherwise a single-line todo()
        // leaks its own `'),` into the excerpt.
        const after = body.slice(m.index + m[0].length, m.index + m[0].length + 600);
        const parts = [...after.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((q) => q[1]);
        const text = parts.join(' ').replace(/\\'/g, "'").replace(/\s+/g, ' ').trim();
        current.first = text.split(/(?<=\.)\s/)[0].slice(0, 96);
      }
    }
  }
  return out;
}

console.log('\nwhat still needs content');
let total = 0;
for (const doc of docs) {
  const sections = todosBySection(doc.constName);
  const withTodos = sections.filter((s) => s.count > 0);
  const n = withTodos.reduce((a, s) => a + s.count, 0);
  total += n;
  const headingFor = (id) => manifest[doc.key].sections.find((s) => s.id === id)?.heading ?? id;
  console.log(`\n  ${doc.label} — ${n} TODO block(s) across ${withTodos.length}/${sections.length} sections`);
  for (const s of withTodos) {
    console.log(`    [ ] ${headingFor(s.id).padEnd(34)} (#${s.id}${s.count > 1 ? `, ${s.count} blocks` : ''})`);
    if (s.first) console.log(`        ${s.first}…`);
  }
}

/* ---- 3. the gate --------------------------------------------------------- */

console.log('\n' + '─'.repeat(74));
if (failures > 0) {
  console.log(`STRUCTURE BROKEN — ${failures} problem(s) above. Fix these first.`);
  process.exit(1);
}
if (total > 0) {
  console.log(
    `INCOMPLETE — ${total} TODO block(s) remain.\n\n` +
      `This is the expected state until a lawyer has been engaged. LEGAL_BRIEF.md\n` +
      `at the repo root is the document to send them; it contains the verified\n` +
      `data inventory and the specific questions.\n\n` +
      `This check exits 1 ON PURPOSE so an unfinished policy cannot ship as if it\n` +
      `were done. It is NOT part of \`npm run verify\`, so ordinary work is not\n` +
      `blocked by it.\n`,
  );
  process.exit(1);
}
console.log('COMPLETE — every section has content. Set DRAFT = false in lib/legal.ts.\n');
