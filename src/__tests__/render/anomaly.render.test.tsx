// AnomalyBanner (insights feed entry point) and AnomalyCard (the anomalies
// list item) — row 19's remaining gap, previously only a code-reading note.
// This EXECUTES both components; it is not a source-text grep.
import { AnomalyBanner } from '@/components/ai/AnomalyBanner';
import { AnomalyCard } from '@/components/ai/AnomalyCard';
import { useInsights } from '@/lib/data/aiBrain';
import type { AIAnomaly } from '@/lib/api';
import { allText, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

jest.mock('@/lib/data/aiBrain', () => ({
  useInsights: jest.fn(() => ({ anomalies: [], dismiss: jest.fn() })),
}));

const FIXTURE: AIAnomaly = {
  id: 'anomaly-1',
  title: 'Unusual spike in sodium',
  body: 'Sodium intake was well above your recent average yesterday.',
  dismissed: false,
  created_at: '2026-01-01T00:00:00.000Z',
};

test('AnomalyBanner shows the single anomaly title when insights carries one anomaly', () => {
  (useInsights as jest.Mock).mockReturnValue({ anomalies: [FIXTURE], dismiss: jest.fn() });

  const tree = renderScreen(<AnomalyBanner onPress={jest.fn()} />);

  expect(allText(tree)).toContain('Unusual spike in sodium');
});

test('AnomalyCard shows the fixture anomaly title and body', () => {
  const tree = renderScreen(<AnomalyCard anomaly={FIXTURE} onDismiss={jest.fn()} />);

  const text = allText(tree);
  expect(text).toContain('Unusual spike in sodium');
  expect(text).toContain('Sodium intake was well above your recent average yesterday.');
});
