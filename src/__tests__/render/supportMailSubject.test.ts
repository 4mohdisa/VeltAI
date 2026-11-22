// PHASE3_ROWS.md row 16, Support screen (src/app/profile/support.tsx): the
// feedback email subject reads support.mailSubject, which must be real text in
// every locale and translated in Spanish and French.
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
] as const)('%s: support.mailSubject is non-empty', (_lng, locale) => {
  expect(locale.support.mailSubject.trim()).not.toBe('');
});

test.each([
  ['es', es],
  ['fr', fr],
] as const)('%s: support.mailSubject differs from the English', (_lng, locale) => {
  expect(locale.support.mailSubject).not.toBe(en.support.mailSubject);
});
