// Numbers follow the app language (PHASE4_ROWS.md row 2b). English keeps the
// Australian separators; Spanish and French use their own. formatNumber,
// formatGrams, formatMacro and the units helpers all read the locale through dateLocale.
import i18n from '@/lib/i18n';
import { formatGrams, formatMacro, formatNumber } from '@/lib/formatting';
import { formatMass, formatWeight } from '@/lib/units';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

test('en: output is unchanged', () => {
  expect(formatNumber(12345.4)).toBe('12,345');
  expect(formatMass(12345, 'g')).toBe('12,345 g');
  expect(formatWeight(80.5, 'kg')).toBe('80.5 kg');
});

test.each([
  ['es', '12.345', '12.345 g', '80,5 kg'],
  ['fr', '12 345', '12 345 g', '80,5 kg'],
])('%s: uses its own separators', async (lng, number, mass, weight) => {
  await i18n.changeLanguage(lng);
  expect(formatNumber(12345.4)).toBe(number);
  expect(formatMass(12345, 'g')).toBe(mass);
  expect(formatWeight(80.5, 'kg')).toBe(weight);
});

test('changing the language changes the output', async () => {
  const english = formatNumber(12345);
  await i18n.changeLanguage('fr');
  expect(formatNumber(12345)).not.toBe(english);
  await i18n.changeLanguage('en');
  expect(formatNumber(12345)).toBe(english);
});

test.each([
  ['en', '33 g', '12,346 g'],
  ['es', '33 g', '12.346 g'],
  ['fr', '33 g', '12\u202f346 g'],
])('%s: formatGrams rounds and groups in the app language', async (lng, small, large) => {
  await i18n.changeLanguage(lng);
  expect(formatGrams(32.6)).toBe(small);
  expect(formatGrams(12345.6)).toBe(large);
});

test.each([
  ['en', '32 g protein', '1,234 g protein'],
  ['es', '32 g protein', '1234 g protein'],
  ['fr', '32 g protein', '1\u202f234 g protein'],
])('%s: formatMacro rounds and groups in the app language', async (lng, small, large) => {
  await i18n.changeLanguage(lng);
  expect(formatMacro('Protein', 32.2)).toBe(small);
  expect(formatMacro('Protein', 1234)).toBe(large);
});
