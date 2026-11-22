// PHASE3_ROWS.md row 15, Privacy screen (src/app/profile/privacy.tsx). Rendered
// in English, Spanish and French: the eyebrow and the title read from the locale
// file. The screen takes no route params, so the shared expo-router mock is enough.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import PrivacyScreen from '@/app/profile/privacy';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, renderScreen } from './helpers';

// The screen reads the stored AI consent on mount; a settled answer keeps the
// render deterministic.
jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn().mockResolvedValue(false),
  revokeAiConsent: jest.fn(),
}));

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
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PrivacyScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });

  const text = allText(tree);
  expect(text).toContain(locale.settings.privacyEyebrow);
  expect(text).toContain(locale.settings.privacy);
  // Quoted: the serialised tree also holds props, so match the whole text node.
  // The body's 'Your data' section title is still English, so only the
  // eyebrow's copy of it may be gone.
  const englishEyebrow = text.split(JSON.stringify(en.settings.privacyEyebrow)).length - 1;
  expect(englishEyebrow).toBe(lng === 'en' ? 2 : 1);
  if (lng !== 'en') expect(text).not.toContain(JSON.stringify(en.settings.privacy));
});
