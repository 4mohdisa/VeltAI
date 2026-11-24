/// <reference types="jest" />
// Row 29, i18n parity: en, es and fr carry the same keys, the same {{name}}
// placeholders per key, and only _one/_other plural pairs.
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';

type Flat = Map<string, string>;

function flatten(node: unknown, prefix = '', out: Flat = new Map()): Flat {
  if (node !== null && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.set(prefix, String(node));
  }
  return out;
}

const LOCALES: Record<string, Flat> = { en: flatten(en), es: flatten(es), fr: flatten(fr) };
const base = LOCALES.en;
const others = Object.entries(LOCALES).filter(([lang]) => lang !== 'en');

const placeholders = (s: string) => [...new Set([...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]))].sort();

test('every locale has exactly the keys en has', () => {
  const missing: Record<string, { missingHere: string[]; missingInEn: string[] }> = {};
  for (const [lang, flat] of others) {
    const missingHere = [...base.keys()].filter((k) => !flat.has(k));
    const missingInEn = [...flat.keys()].filter((k) => !base.has(k));
    if (missingHere.length || missingInEn.length) missing[lang] = { missingHere, missingInEn };
  }
  expect(missing).toEqual({});
});

test('every key has the same placeholders in every locale', () => {
  const mismatched: Record<string, Record<string, string[]>> = {};
  for (const [key, value] of base) {
    const want = placeholders(value).join(',');
    for (const [lang, flat] of others) {
      const got = flat.get(key);
      if (got !== undefined && placeholders(got).join(',') !== want) {
        mismatched[key] = { ...mismatched[key], en: placeholders(value), [lang]: placeholders(got) };
      }
    }
  }
  expect(mismatched).toEqual({});
});

test('plurals are _one/_other pairs only', () => {
  const problems: Record<string, string[]> = {};
  for (const [lang, flat] of Object.entries(LOCALES)) {
    const bad = [...flat.keys()].filter(
      (k) =>
        /_(zero|two|few|many)$/.test(k) ||
        (k.endsWith('_one') && !flat.has(`${k.slice(0, -'_one'.length)}_other`)),
    );
    if (bad.length) problems[lang] = bad;
  }
  expect(problems).toEqual({});
});
