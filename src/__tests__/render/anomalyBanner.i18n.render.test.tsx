// PHASE3_ROWS.md row 15, AnomalyBanner (src/components/ai/AnomalyBanner.tsx) copy.
// Rendered in Spanish and French: one untitled anomaly shows the locale's
// fallback title, two show the locale's plural count title, and the dismiss
// label reads from the locale file. No English is left.
import type { AIAnomaly } from '@/lib/api';
import { AnomalyBanner } from '@/components/ai/AnomalyBanner';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

const untitled = (id: string): AIAnomaly => ({ id, dismissed: false, created_at: '2026-01-01T00:00:00.000Z' });

type Tree = ReturnType<typeof renderScreen>;
const byLabel = (tree: Tree, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function');

const renderBanner = (anomalies: AIAnomaly[]) =>
  renderScreen(<AnomalyBanner anomalies={anomalies} isError={false} onPress={jest.fn()} onDismiss={jest.fn()} />);

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['es', es],
  ['fr', fr],
])('%s: fallback title, plural count title and dismiss label read from the locale file', async (lang, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const copy = locale.insights.anomaly;

  const one = renderBanner([untitled('a1')]);
  expect(allText(one)).toContain(copy.fallbackTitle);
  expect(allText(one)).not.toContain(en.insights.anomaly.fallbackTitle);
  expect(byLabel(one, copy.fallbackTitle).length).toBeGreaterThan(0);
  expect(byLabel(one, copy.dismiss).length).toBeGreaterThan(0);
  expect(byLabel(one, en.insights.anomaly.dismiss)).toHaveLength(0);

  const two = renderBanner([untitled('a1'), untitled('a2')]);
  const plural = copy.bannerCount_other.replace('{{count}}', '2');
  expect(allText(two)).toContain(plural);
  expect(allText(two)).not.toContain(en.insights.anomaly.bannerCount_other.replace('{{count}}', '2'));
  expect(byLabel(two, plural).length).toBeGreaterThan(0);
  expect(byLabel(two, copy.dismiss).length).toBeGreaterThan(0);
});
