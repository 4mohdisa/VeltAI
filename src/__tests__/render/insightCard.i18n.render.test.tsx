// PHASE3_ROWS.md row 15, InsightCard (src/components/ai/InsightCard.tsx) copy.
// Rendered in Spanish and French: the dismiss label and the more/less toggle
// read from the locale file and no English is left. The insight title is the
// server's text and shows as sent.
import type { AIInsight } from '@/lib/api';
import { InsightCard } from '@/components/ai/InsightCard';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import fr from '@/lib/i18n/locales/fr.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

const INSIGHT: AIInsight = {
  id: 'insight-1',
  type: null,
  title: 'Protein dips on rest days',
  body: 'On days without a workout your protein lands well under target. A protein-forward breakfast on those days would close most of the gap without changing anything else you do.',
  data: null,
  shown_at: null,
  dismissed: false,
  created_at: '2026-11-20T08:00:00.000Z',
};

type Tree = ReturnType<typeof renderScreen>;
const byLabel = (tree: Tree, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && typeof p.onPress === 'function');
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;

afterAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test.each([
  ['es', es],
  ['fr', fr],
])('%s: the dismiss label and the more/less toggle read from the locale file', async (lang, locale) => {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
  const card = locale.insights.card;
  const tree = renderScreen(<InsightCard insight={INSIGHT} onDismiss={jest.fn()} />);

  expect(allText(tree)).toContain(INSIGHT.title);
  expect(byLabel(tree, card.dismiss).length).toBeGreaterThan(0);
  expect(byLabel(tree, en.insights.card.dismiss)).toHaveLength(0);

  const toggle = byLabel(tree, card.showMore)[0];
  expect(toggle).toBeDefined();
  expect(hasText(tree, card.more)).toBe(true);
  expect(hasText(tree, en.insights.card.more)).toBe(false);

  await act(async () => {
    (toggle.props.onPress as () => void)();
  });
  expect(byLabel(tree, card.showLess).length).toBeGreaterThan(0);
  expect(hasText(tree, card.less)).toBe(true);
  expect(hasText(tree, en.insights.card.less)).toBe(false);

  const typed = allText(renderScreen(<InsightCard insight={{ ...INSIGHT, type: 'protein_gap' }} onDismiss={jest.fn()} />));
  expect(typed).toContain(card.type.protein_gap);
  expect(typed).not.toContain(en.insights.card.type.protein_gap);

  const unknown = allText(renderScreen(<InsightCard insight={{ ...INSIGHT, type: 'sleep_pattern' }} onDismiss={jest.fn()} />));
  expect(unknown).toContain('sleep_pattern');
});
