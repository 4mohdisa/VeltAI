// PHASE3_ROWS.md row 15, Account screen (src/app/profile/account.tsx). Rendered
// in English, Spanish and French: the eyebrow, the title and the Save button read
// from the locale file. The screen takes no route params, so the shared
// expo-router mock is enough.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import AccountScreen from '@/app/profile/account';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

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
])('%s: the eyebrow, title and Save button read from the locale file', async (lng, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AccountScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {});

  const text = allText(tree);
  expect(text).toContain(locale.settings.accountEyebrow);
  expect(text).toContain(locale.settings.account);
  expect(buttonWithTitle(tree, locale.common.save)).toBeDefined();
  if (lng !== 'en') expect(text).not.toContain(en.settings.accountEyebrow);
});
