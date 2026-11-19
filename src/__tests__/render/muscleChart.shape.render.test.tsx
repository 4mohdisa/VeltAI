// MuscleChart response shape guard (PHASE2_ROWS.md row 79) — same gap as
// GymPatternsCard (row 78): useGymPatterns() just passes the /api/gym/patterns
// response through with no shape check. MuscleChart now reuses
// GymPatternsCard's isGymPatternsShape() guard, falling back to its own
// existing "not enough data" empty state for anything that isn't a plain
// GymPatterns object, same as a valid response with no muscle data at all.
import { MuscleChart } from '@/components/gym/MuscleChart';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import { allText, renderScreen } from './helpers';

jest.mock('@/lib/data/gymSchedule', () => ({ useGymPatterns: jest.fn() }));

const EMPTY_STATE = 'Log workouts to see which muscles you hit';

const PATTERNS = {
  most_trained_muscles: ['chest'],
  least_trained_muscles: ['calves'],
  avg_sessions_per_week: 3.2,
  adherence_rate: 0.75,
  customization_rate: 0.5,
  most_missed_day: 'Friday',
  muscle_volume_map: { chest: 500, back: 300 },
  last_rebuilt: '2026-11-01',
};

const mockPatterns = (patterns: unknown) => {
  (useGymPatterns as jest.Mock).mockReturnValue({ patterns, loading: false });
};

test('a null response shows the existing empty state, not a crash', () => {
  mockPatterns(null);
  const tree = renderScreen(<MuscleChart />);
  expect(allText(tree)).toContain(EMPTY_STATE);
});

test('an array response falls back to the empty state, not a crash', () => {
  mockPatterns([]);
  const tree = renderScreen(<MuscleChart />);
  expect(allText(tree)).toContain(EMPTY_STATE);
});

test('a real GymPatterns object with volume data still renders the chart', () => {
  mockPatterns(PATTERNS);
  const tree = renderScreen(<MuscleChart />);
  const text = allText(tree);
  expect(text).not.toContain(EMPTY_STATE);
  expect(text).toContain('Chest');
  expect(text).toContain('Back');
});
