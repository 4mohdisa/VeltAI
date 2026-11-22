// PHASE3_ROWS.md row 15, About screen (src/app/profile/about.tsx). Rendered in
// English, Spanish and French: the eyebrow and the title read from the locale
// file. The screen takes no route params, so the shared expo-router mock is enough.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import AboutScreen from '@/app/profile/about';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, renderScreen } from './helpers';

// The floating Screen reads the safe-area insets, which a test renderer never measures.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['en', en],
  ['es', es],
  ['fr', fr],
])('%s: the eyebrow and title read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const text = allText(
    renderScreen(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AboutScreen />
      </SafeAreaProvider>,
    ),
  );

  expect(text).toContain(locale.settings.aboutEyebrow);
  expect(text).toContain(locale.settings.about);
  if (lng !== 'en') expect(text).not.toContain(en.settings.aboutEyebrow);
});
