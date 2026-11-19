// GymPatternsCard response shape guard (PHASE2_ROWS.md row 78) — the card
// crashed if /api/gym/patterns ever resolved to something other than null or
// a real GymPatterns object (useGymPatterns() just passes the response
// through with no shape check). An array response in particular reached
// `patterns.most_trained_muscles.slice(...)` with no `most_trained_muscles`
// to slice. Anything that isn't a plain object now falls back to the card's
// existing "not enough data yet" empty state instead of throwing.
import { GymPatternsCard } from '@/components/gym/GymPatternsCard';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import { allText, renderScreen } from './helpers';

jest.mock('@/lib/data/gymSchedule', () => ({ useGymPatterns: jest.fn() }));

const EMPTY_STATE = 'Keep logging to see patterns';

const PATTERNS = {
  most_trained_muscles: ['Chest', 'Back'],
  least_trained_muscles: ['Calves'],
  avg_sessions_per_week: 3.2,
  adherence_rate: 0.75,
  customization_rate: 0.5,
  most_missed_day: 'Friday',
  muscle_volume_map: null,
  last_rebuilt: '2026-11-01',
};

const mockPatterns = (patterns: unknown) => {
  (useGymPatterns as jest.Mock).mockReturnValue({ patterns, loading: false });
};

test('a null response shows the existing empty state, not a crash', () => {
  mockPatterns(null);
  const tree = renderScreen(<GymPatternsCard />);
  expect(allText(tree)).toContain(EMPTY_STATE);
});

test('an array response (the real-world bug) falls back to the empty state, not a crash', () => {
  mockPatterns([]);
  const tree = renderScreen(<GymPatternsCard />);
  expect(allText(tree)).toContain(EMPTY_STATE);
});

test('a real GymPatterns object still renders the full card', () => {
  mockPatterns(PATTERNS);
  const tree = renderScreen(<GymPatternsCard />);
  const text = allText(tree);
  expect(text).not.toContain(EMPTY_STATE);
  expect(text).toContain('Chest');
  expect(text).toContain('Calves');
  expect(text).toContain('You often skip Friday');
});
