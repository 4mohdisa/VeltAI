// PHASE3_ROWS.md row 15, Support screen (src/app/profile/support.tsx) body copy:
// the row labels, the feedback field and the send button read from the locale
// file, and no English label is left in Spanish.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import SupportScreen from '@/app/profile/support';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, allText, renderScreen } from './helpers';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares

const labels = (l: Locale) => [
  l.support.emailSupport,
  l.support.appVersion,
  l.support.sendFeedback,
  l.support.feedbackPlaceholder,
];

const renderText = () =>
  allText(
    renderScreen(
      <SafeAreaProvider initialMetrics={METRICS}>
        <SupportScreen />
      </SafeAreaProvider>,
    ),
  );

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('English: the Support labels read from en.json', () => {
  const text = renderText();
  for (const label of labels(en)) {
    expect(text).toContain(JSON.stringify(label));
  }
});

test('Spanish: the Support labels read from es.json and no English label remains', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  const text = renderText();
  for (const label of labels(es)) {
    expect(text).toContain(JSON.stringify(label));
  }
  for (const label of labels(en)) {
    expect(text).not.toContain(JSON.stringify(label));
  }
});
