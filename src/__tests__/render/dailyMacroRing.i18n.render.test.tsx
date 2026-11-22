// PHASE3_ROWS.md row 15, DailyMacroRing (src/components/domain/DailyMacroRing.tsx)
// accessibility label. Rendered in Spanish and French, the word between the
// consumed and target figures reads nutrition.ringOf from the locale file, not
// the English "of".
import { DailyMacroRing } from '@/components/domain/DailyMacroRing';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['es', es],
  ['fr', fr],
])('%s: the ring label joins consumed and target with the locale word', async (lang, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });

  const tree = renderScreen(<DailyMacroRing consumed={500} target={900} />);
  const labels = findAll(tree, (p) => typeof p.accessibilityLabel === 'string').map(
    (n) => n.props.accessibilityLabel as string,
  );

  expect(labels).toContain(`500 ${locale.nutrition.ringOf} 900 kcal`);
  for (const label of labels) expect(label.split(' ')).not.toContain(en.nutrition.ringOf);
});
