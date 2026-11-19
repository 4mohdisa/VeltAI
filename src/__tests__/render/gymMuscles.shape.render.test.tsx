// Gym muscles screen response shape guard (PHASE2_ROWS.md row 80) — same gap
// as GymPatternsCard (row 78) and MuscleChart (row 79): useGymPatterns() just
// passes the /api/gym/patterns response through with no shape check. This
// screen already reads `patterns?.muscle_volume_map` with optional chaining
// and gates every further access behind `hasData`, so this is proof of that,
// not a fix — see PHASE2_ROWS.md row 80 for what that means for the guard.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import MuscleFocusScreen from '@/app/gym/muscles';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import { allText, renderScreen } from './helpers';

jest.mock('@/lib/data/gymSchedule', () => ({ useGymPatterns: jest.fn() }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const EMPTY_STATE = 'No muscle data yet';

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

const renderMuscles = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <MuscleFocusScreen />
    </SafeAreaProvider>,
  );

test('a null response shows the existing empty state, not a crash', () => {
  mockPatterns(null);
  const tree = renderMuscles();
  expect(allText(tree)).toContain(EMPTY_STATE);
});

test('an array response falls back to the empty state, not a crash', () => {
  mockPatterns([]);
  const tree = renderMuscles();
  expect(allText(tree)).toContain(EMPTY_STATE);
});

test('a real GymPatterns object with volume data still renders the full screen', () => {
  mockPatterns(PATTERNS);
  const tree = renderMuscles();
  const text = allText(tree);
  expect(text).not.toContain(EMPTY_STATE);
  expect(text).toContain('Chest');
  expect(text).toContain('Back');
});
