// PHASE3_ROWS.md row 15, AnomalyCard (src/components/ai/AnomalyCard.tsx) copy.
// Rendered in Spanish and French: the server's title and body show as sent, the
// dismiss label reads from the locale file, and with no title or body the
// fallback copy is the locale's. No English is left.
import type { AIAnomaly } from '@/lib/api';
import { AnomalyCard } from '@/components/ai/AnomalyCard';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

const FIXTURE: AIAnomaly = {
  id: 'anomaly-1',
  title: 'Unusual spike in sodium',
  body: 'Sodium intake was well above your recent average yesterday.',
  dismissed: false,
  created_at: '2026-01-01T00:00:00.000Z',
};

type Tree = ReturnType<typeof renderScreen>;
const byLabel = (tree: Tree, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function');

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['es', es],
  ['fr', fr],
])('%s: server text shows as sent, the dismiss label and fallbacks read from the locale file', async (lang, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const copy = locale.insights.anomaly;

  const tree = renderScreen(<AnomalyCard anomaly={FIXTURE} onDismiss={jest.fn()} />);
  const text = allText(tree);
  expect(text).toContain(FIXTURE.title);
  expect(text).toContain(FIXTURE.body);
  expect(byLabel(tree, copy.dismiss).length).toBeGreaterThan(0);
  expect(byLabel(tree, en.insights.anomaly.dismiss)).toHaveLength(0);

  const untitled: AIAnomaly = { id: FIXTURE.id, dismissed: false, created_at: FIXTURE.created_at };
  const fallback = allText(renderScreen(<AnomalyCard anomaly={untitled} onDismiss={jest.fn()} />));
  expect(fallback).toContain(copy.fallbackTitle);
  expect(fallback).toContain(copy.fallbackBody);
  expect(fallback).not.toContain(en.insights.anomaly.fallbackTitle);
  expect(fallback).not.toContain(en.insights.anomaly.fallbackBody);
});
