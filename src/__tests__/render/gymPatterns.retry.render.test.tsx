// PHASE3_ROWS.md row 14b: the Gym tab patterns card (GymPatternsCard) offers Try
// again when the patterns read fails, and the button re-runs the read via refetch.
import { GymPatternsCard } from '@/components/gym/GymPatternsCard';
import { useGymPatterns } from '@/lib/data/gymSchedule';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/data/gymSchedule', () => ({ useGymPatterns: jest.fn() }));
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

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

const refetch = jest.fn();

const mockPatterns = (patterns: unknown, isError: boolean) => {
  (useGymPatterns as jest.Mock).mockReturnValue({ patterns, loading: false, isError, refetch });
};

type Tree = ReturnType<typeof renderScreen>;
// findAll sees the Pressable and its host view, so check presence, not a count.
const retryButtons = (tree: Tree) =>
  findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain && typeof p.onPress === 'function');

beforeEach(() => refetch.mockClear());

test('a failed read shows the load-failed notice with Try again', () => {
  mockPatterns(null, true);
  const tree = renderScreen(<GymPatternsCard />);

  expect(allText(tree)).toContain(en.gym.loadFailed);
  expect(allText(tree)).toContain(en.common.tryAgain);
  expect(retryButtons(tree).length).toBeGreaterThan(0);
});

test('pressing Try again calls refetch once', () => {
  mockPatterns(null, true);
  const tree = renderScreen(<GymPatternsCard />);

  act(() => {
    (retryButtons(tree)[0].props.onPress as () => void)();
  });
  expect(refetch).toHaveBeenCalledTimes(1);
});

test('loaded data shows no error notice', () => {
  mockPatterns(PATTERNS, false);
  const tree = renderScreen(<GymPatternsCard />);

  expect(allText(tree)).not.toContain(en.gym.loadFailed);
  expect(retryButtons(tree).length).toBe(0);
});
