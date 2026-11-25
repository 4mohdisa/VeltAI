// PHASE3_ROWS.md row 15, Insights screen (src/app/insights.tsx) copy. The screen
// is rendered in Spanish with its hooks mocked, so nothing reaches the network,
// and every key the screen uses must exist in en, es and fr.
import { readFileSync } from 'fs';
import { join } from 'path';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import InsightsScreen from '@/app/insights';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

const mockBrain = { notEnoughData: true };

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/data/aiBrain', () => ({
  useInsights: jest.fn(() => ({ insights: [], anomalies: [], loading: false, isError: false, dismiss: jest.fn() })),
  useBrainProfile: jest.fn(() => ({ profile: null, loading: false, notEnoughData: mockBrain.notEnoughData })),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

async function renderInsights() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <InsightsScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

beforeAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
});

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

beforeEach(() => {
  mockBrain.notEnoughData = true;
});

test('the header, Ask Lume entry and learning state read from es.json', async () => {
  const tree = await renderInsights();
  const text = allText(tree);

  expect(text).toContain(es.insights.eyebrow);
  expect(text).toContain(es.insights.title);
  expect(text).toContain(es.insights.askLume);
  expect(text).toContain(es.insights.askLumeHint);
  expect(text).toContain(es.insights.learningTitle);
  expect(text).toContain(es.insights.learningMessage);
  expect(findAll(tree, (p) => p.accessibilityLabel === es.insights.askLume && typeof p.onPress === 'function').length).toBeGreaterThan(0);
  expect(text).not.toContain(en.insights.askLumeHint);
});

test('the no-insights state reads from es.json', async () => {
  mockBrain.notEnoughData = false;
  const text = allText(await renderInsights());

  expect(text).toContain(es.insights.emptyTitle);
  expect(text).toContain(es.insights.emptyMessage);
  expect(text).not.toContain(en.insights.emptyMessage);
});

test('every key the screen uses exists in en, es and fr', () => {
  const src = readFileSync(join(__dirname, '..', '..', 'app', 'insights.tsx'), 'utf8');
  const keys = [...src.matchAll(/\bt\('([^']+)'/g)].map((m) => m[1]);
  expect(keys.length).toBeGreaterThan(0);
  const lookup = (locale: object, key: string) =>
    key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], locale);
  for (const locale of [en, es, fr]) {
    for (const key of keys) expect(typeof lookup(locale, key)).toBe('string');
  }
});
