// AnomalyBanner (insights feed entry point) and AnomalyCard (the anomalies
// list item) — row 19's remaining gap, previously only a code-reading note.
// This EXECUTES both components; it is not a source-text grep.
import { AnomalyBanner } from '@/components/ai/AnomalyBanner';
import { AnomalyCard } from '@/components/ai/AnomalyCard';
import type { AIAnomaly } from '@/lib/api';
import { allText, renderScreen } from './helpers';

jest.mock('@/lib/design/reduceMotion', () => ({ useReduceMotion: jest.fn(() => true) }));

const FIXTURE: AIAnomaly = {
  id: 'anomaly-1',
  title: 'Unusual spike in sodium',
  body: 'Sodium intake was well above your recent average yesterday.',
  dismissed: false,
  created_at: '2026-01-01T00:00:00.000Z',
};

test('AnomalyBanner shows the single anomaly title when insights carries one anomaly', () => {
  const tree = renderScreen(
    <AnomalyBanner anomalies={[FIXTURE]} isError={false} onPress={jest.fn()} onDismiss={jest.fn()} />,
  );

  expect(allText(tree)).toContain('Unusual spike in sodium');
});

test('AnomalyBanner shows the shared error copy instead of anomalies when the insights read failed', () => {
  const tree = renderScreen(
    <AnomalyBanner anomalies={[FIXTURE]} isError onPress={jest.fn()} onDismiss={jest.fn()} />,
  );

  const text = allText(tree);
  expect(text).toContain('Something went wrong');
  expect(text).not.toContain('Unusual spike in sodium');
});

test('AnomalyCard shows the fixture anomaly title and body', () => {
  const tree = renderScreen(<AnomalyCard anomaly={FIXTURE} onDismiss={jest.fn()} />);

  const text = allText(tree);
  expect(text).toContain('Unusual spike in sodium');
  expect(text).toContain('Sodium intake was well above your recent average yesterday.');
});
