// PHASE3_ROWS.md row 17, Ask Lume (src/app/ai-query.tsx) copy: the title,
// subtitle, empty prompt, suggestion chips, input label and placeholder, the
// back and send labels, and the unavailable state read from the locale file in
// en, es and fr. The AI hook and consent are mocked as in aiQuery.render.test.tsx,
// so no network is called.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import AIQueryScreen from '@/app/ai-query';
import { useAIQuery } from '@/lib/data/aiBrain';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/data/aiBrain', () => ({
  useAIQuery: jest.fn(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

type Locale = typeof es; // en also has English-only keys, so es is the shape every locale shares

const firstScreen = (l: Locale) => [
  l.insights.askLume,
  l.aiQuery.subtitle,
  l.aiQuery.emptyPrompt,
  l.aiQuery.suggestionProtein,
  l.aiQuery.suggestionGymDays,
  l.aiQuery.suggestionTopFood,
  l.aiQuery.suggestionGoal,
  l.aiQuery.placeholder,
];
const labels = (l: Locale) => [l.aiQuery.back, l.aiQuery.inputLabel, l.feedback.send];
const unavailable = (l: Locale) => [l.aiQuery.unavailableTitle, l.aiQuery.unavailableMessage];

async function render(lng: string) {
  await act(async () => {
    await i18n.changeLanguage(lng);
  });
  return renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AIQueryScreen />
    </SafeAreaProvider>,
  );
}

// Sends one question so the screen leaves its empty prompt for the answer area.
async function renderUnavailable(lng: string, locale: Locale): Promise<string> {
  (useAIQuery as jest.Mock).mockReturnValue({ ask: jest.fn(() => Promise.resolve('')), loading: false, unavailable: true });
  const tree = await render(lng);
  act(() => {
    const input = findAll(tree, (p) => typeof p.onChangeText === 'function')[0];
    (input.props.onChangeText as (v: string) => void)('protein?');
  });
  await act(async () => {
    const send = findAll(tree, (p) => p.accessibilityLabel === locale.feedback.send)[0];
    (send.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
  return allText(tree);
}

const LOCALES: [string, Locale][] = [
  ['en', en],
  ['es', es],
  ['fr', fr],
];

beforeEach(() => {
  (useAIQuery as jest.Mock).mockReturnValue({ ask: jest.fn(() => Promise.resolve('')), loading: false, unavailable: false });
});

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each(LOCALES)('%s: the first screen and its labels read from the locale file', async (lng, locale) => {
  const tree = await render(lng);
  const text = allText(tree);
  for (const s of firstScreen(locale)) expect(text).toContain(JSON.stringify(s));
  const a11y = findAll(tree, (p) => typeof p.accessibilityLabel === 'string').map((n) => String(n.props.accessibilityLabel));
  for (const s of labels(locale)) expect(a11y).toContain(s);
  if (lng !== 'en') {
    for (const s of firstScreen(en)) expect(text).not.toContain(JSON.stringify(s));
    for (const s of labels(en)) expect(a11y).not.toContain(s);
  }
});

test.each(LOCALES)('%s: the unavailable state reads from the locale file', async (lng, locale) => {
  const text = await renderUnavailable(lng, locale);
  for (const s of unavailable(locale)) expect(text).toContain(JSON.stringify(s));
  if (lng !== 'en') for (const s of unavailable(en)) expect(text).not.toContain(JSON.stringify(s));
});
