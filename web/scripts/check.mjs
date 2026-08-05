/* Pre-publish checks that do not need a browser.  `node scripts/check.mjs`
   Run AFTER `next build`, because the social-proof and feature-claim checks
   run against the EXPORTED HTML in out/ — what actually ships — rather than
   against source, where the same words appear legitimately in comments
   explaining why they are banned.

   Two jobs:
     1. Assert the scroll-driven section's pure math (lib/scroll.ts).
     2. Assert the shipped pages contain NO fabricated social proof and no
        unsupported feature claim. Lume has zero users, zero ratings and zero
        reviews; a testimonial, a star rating or a download count would be
        false advertising under s18 of the Australian Consumer Law. This
        repository has shipped fabricated data to users three separate times,
        and the previous version of this very site claimed an Apple Health
        integration that does not exist in any form. This is the backstop. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out');
let failures = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const fail = (m, d) => { failures++; console.log(`  FAIL  ${m}\n        ${d}`); };
const near = (name, actual, expected) =>
  Math.abs(actual - expected) < 1e-9 ? ok(name) : fail(name, `expected ${expected}, got ${actual}`);
const eq = (name, a, e) =>
  JSON.stringify(a) === JSON.stringify(e) ? ok(name) : fail(name, `expected ${JSON.stringify(e)}, got ${JSON.stringify(a)}`);

/* ---- 1. scroll math -------------------------------------------------------
   Duplicated from lib/scroll.ts as the SPEC: this file is plain ESM and the
   source is TS, and the functions are four lines. If they diverge, the
   assertions below are the definition of correct. */
const beatAt = (progress, count) => {
  const p = Math.min(1, Math.max(0, progress));
  const scaled = p * count;
  const active = Math.min(count - 1, Math.floor(scaled));
  return { active, within: Math.min(1, scaled - active) };
};
const progressAt = (y, top, span) => Math.min(1, Math.max(0, (y - top) / Math.max(1, span)));

console.log('\nscroll math');
eq('section start → first beat', beatAt(0, 4).active, 0);
eq('45% → second beat', beatAt(0.45, 4).active, 1);
near('…80% through it', beatAt(0.45, 4).within, 0.8);
eq('exactly 1 does not roll past the last beat', beatAt(1, 4), { active: 3, within: 1 });
eq('above 1 clamps', beatAt(1.7, 4), { active: 3, within: 1 });
eq('below 0 clamps', beatAt(-0.5, 4), { active: 0, within: 0 });
eq('scrolling back up runs it backwards', progressAt(500, 100, 800), 0.5);
eq('past the end clamps to 1', progressAt(9999, 100, 800), 1);
eq('before the start clamps to 0', progressAt(0, 100, 800), 0);
eq('a zero span cannot divide by zero', progressAt(200, 100, 0), 1);

/* ---- 2. shipped HTML ---------------------------------------------------- */
if (!existsSync(OUT)) {
  fail('out/ missing', 'run `npm run build` first — these checks read the exported HTML');
} else {
  const html = [];
  (function walk(d) {
    for (const e of readdirSync(d)) {
      const f = join(d, e);
      if (statSync(f).isDirectory()) walk(f);
      else if (e.endsWith('.html')) html.push(f);
    }
  })(OUT);

  // Visible text only: strip scripts/styles/tags, decode the few entities used.
  const textOf = (f) =>
    readFileSync(f, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&#160;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#x27;|&apos;/g, "'")
      .replace(/\s+/g, ' ');

  const BANNED = [
    [/\b\d[\d,.]*\s*(k\+?\s*)?(5[- ]star|five[- ]star)\b/i, 'star-rating claim'],
    [/\b(rated|rating)\s+\d(\.\d)?\s*(\/|out of)\s*5\b/i, 'numeric rating'],
    [/\b\d[\d,.]*\s*(k|m|\+)?\s+(users|downloads|members|subscribers|athletes)\b/i, 'user/download count'],
    [/\b(join|trusted by|loved by)\s+[\d,]+/i, 'social-count claim'],
    [/\bas\s+(seen|featured)\s+(in|on)\b/i, 'press mention'],
    [/\btestimonial/i, 'testimonial'],
    [/\b(loved|trusted)\s+by\s+(thousands|millions|athletes|people)/i, 'loved/trusted-by claim'],
    [/★|⭐/, 'star glyph'],
  ];

  // Affirmative Apple Health integration claims. The FAQ legitimately asks
  // "Does it sync with Apple Health…?" and answers no, so the question form
  // and any sentence containing a negation are allowed.
  const HEALTH = /(connect|connects|connecting|sync|syncs|syncing|integrat\w*|support\w*|works with|link\w*)\s+(to\s+|with\s+)?Apple\s*Health|Apple\s*Health\s+(integration|sync|connect)/i;
  const NEGATED = /\b(no|not|never|without|yet|cannot|can't|doesn't|does not|lacks)\b/i;

  console.log('\nshipped pages — no fabricated social proof');
  let bad = 0;
  for (const f of html) {
    const text = textOf(f);
    for (const [re, label] of BANNED) {
      const m = text.match(re);
      if (m) { fail(label, `${f.replace(OUT + '/', '')}  …${m[0]}…`); bad++; }
    }
  }
  if (!bad) ok(`${html.length} exported pages carry no rating, count, testimonial or press claim`);

  console.log('\nshipped pages — no unsupported feature claim');
  let hb = 0;
  for (const f of html) {
    // Sentence-level, so a denial in the same sentence exonerates the mention.
    for (const sentence of textOf(f).split(/(?<=[.!?])\s+/)) {
      // A QUESTION is not a claim. "Does it sync with Apple Health?" is
      // allowed precisely because the answer beneath it says no.
      if (sentence.trim().endsWith('?')) continue;
      if (HEALTH.test(sentence) && !NEGATED.test(sentence)) {
        fail('affirmative Apple Health claim', `${f.replace(OUT + '/', '')}  ${sentence.trim().slice(0, 110)}`);
        hb++;
      }
    }
  }
  if (!hb) ok('no page claims an Apple Health integration (the app has none)');

  // The ± calorie-range notation describes a feature the app does not have.
  console.log('\nshipped pages — no invented calorie range');
  let pm = 0;
  for (const f of html) {
    const m = textOf(f).match(/\d\s*(±|\+\/-)\s*\d+\s*(kcal|cal)/i);
    if (m) { fail('calorie ± range', `${f.replace(OUT + '/', '')}  ${m[0]}`); pm++; }
  }
  if (!pm) ok('no page shows a ± calorie range (the app computes no interval)');
}

console.log(`\n${failures === 0 ? 'PASS' : `FAIL — ${failures} problem(s)`}\n`);
process.exit(failures ? 1 : 0);
