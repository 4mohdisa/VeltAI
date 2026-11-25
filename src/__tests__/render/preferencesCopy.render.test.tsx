// PHASE3_ROWS.md row 16, Preferences screen (src/app/profile/preferences.tsx).
// Rendered in English, Spanish and French: every label and hint on the screen
// reads from the locale file, and Spanish and French leave no English behind.
// preferencesLocale.render.test.tsx covers the eyebrow and title.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import type { ReactTestRenderer } from 'react-test-renderer';

import PreferencesScreen from '@/app/profile/preferences';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, findAll, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares

// The default store is metric, so the system hint (not the custom one) shows.
const labels = (l: Locale) => [
  l.settings.preferencesEyebrow,
  l.preferences.title,
  l.preferences.measurementSystem,
  l.preferences.metric,
  l.preferences.imperial,
  l.preferences.systemHint,
  l.preferences.bodyWeight,
  l.preferences.height,
  l.preferences.foodQuantities,
  l.preferences.energy,
];

// SegmentedField renders its label as [label, suffix], so a child array counts too.
const hasText = (tree: ReactTestRenderer, value: string) =>
  findAll(tree, (p) => [p.children].flat().includes(value)).length > 0;

const render = async (lng: string) => {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  return renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PreferencesScreen />
    </SafeAreaProvider>,
  );
};

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('en: every Preferences label reads from en.json', async () => {
  const tree = await render('en');
  for (const value of labels(en)) expect(hasText(tree, value)).toBe(true);
});

test.each([
  ['es', es],
  ['fr', fr],
] as const)('%s: every Preferences label is translated and no English label remains', async (lng, locale) => {
  const tree = await render(lng);
  const translated = labels(locale);
  for (const value of translated) expect(hasText(tree, value)).toBe(true);
  // Spanish "Imperial" is spelled the same as the English, so only labels the
  // locale actually changes are checked for absence.
  for (const value of labels(en).filter((v) => !translated.includes(v))) expect(hasText(tree, value)).toBe(false);
});
