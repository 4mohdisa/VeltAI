// PHASE3_ROWS.md row 15, Privacy screen (src/app/profile/privacy.tsx) body copy:
// the "Your data" section footer reads from the locale file in English, Spanish
// and French, and no English footer is left in es or fr.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import PrivacyScreen from '@/app/profile/privacy';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn().mockResolvedValue(false),
  revokeAiConsent: jest.fn(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

type Locale = typeof en;

const footer = (l: Locale) => JSON.stringify(l.settings.dataFooter);

async function renderText() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PrivacyScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return allText(tree);
}

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('English: the footer reads from en.json', async () => {
  expect(await renderText()).toContain(footer(en));
});

test.each([
  ['es', es],
  ['fr', fr],
])('%s: the footer reads from the locale file and no English footer remains', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const text = await renderText();
  expect(text).toContain(footer(locale as Locale));
  expect(text).not.toContain(footer(en));
});
