// PHASE3_ROWS.md row 15, Privacy screen (src/app/profile/privacy.tsx) Export row:
// the label and VoiceOver hint read from the locale file, and no English label is
// left in Spanish.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import PrivacyScreen from '@/app/profile/privacy';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn().mockResolvedValue(false),
  revokeAiConsent: jest.fn(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares

async function exportRow(l: Locale) {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PrivacyScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return {
    row: findAll(tree, (p) => p.accessibilityRole === 'button' && p.accessibilityLabel === l.settings.exportTitle)[0],
    english: findAll(tree, (p) => p.accessibilityLabel === en.settings.exportTitle),
  };
}

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('English: the Export row label and hint read from en.json', async () => {
  const { row } = await exportRow(en);
  expect(row).toBeDefined();
  expect(row.props.accessibilityHint).toBe(en.settings.exportHint);
});

test('Spanish: the Export row label and hint read from es.json and no English label remains', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const { row, english } = await exportRow(es);
  expect(row).toBeDefined();
  expect(row.props.accessibilityHint).toBe(es.settings.exportHint);
  expect(english).toHaveLength(0);
});
