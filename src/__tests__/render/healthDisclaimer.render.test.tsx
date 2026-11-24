// The health disclaimer (App Store guideline 1.4.1) reads in the app language.
// It is shared by onboarding targets, goals settings and nutrition detail.
import { HealthDisclaimer } from '@/components/display/HealthDisclaimer';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, renderScreen } from './helpers';

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the disclaimer reads from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const text = allText(renderScreen(<HealthDisclaimer />));

  expect(text).toContain(locale.healthDisclaimer.text);
  if (lng !== 'en') expect(text).not.toContain(en.healthDisclaimer.text);
});
