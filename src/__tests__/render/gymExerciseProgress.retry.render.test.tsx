// PHASE3_ROWS.md row 14b: the exercise progress screen offers Try again when the
// progress read fails, and the button re-runs the read via refetch.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ExerciseProgressScreen from '@/app/gym/exercise-progress';
import { useExerciseProgress, useExercises } from '@/lib/data/gymSchedule';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

jest.mock('@/lib/data/gymSchedule', () => ({ useExerciseProgress: jest.fn(), useExercises: jest.fn() }));
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ name: 'Bench press' }),
  usePathname: () => '/gym/exercise-progress',
  Href: {},
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const PROGRESS = {
  exercise_name: 'Bench press',
  history: [
    { date: '2026-11-01', weight: 60, reps: 8, sets: 3 },
    { date: '2026-11-08', weight: 62.5, reps: 8, sets: 3 },
    { date: '2026-11-15', weight: 65, reps: 8, sets: 3 },
  ],
  personal_best: { weight: 65, reps: 8, date: '2026-11-15' },
  trend: 'improving',
};

const refetch = jest.fn();

const mockProgress = (progress: unknown, isError: boolean) => {
  (useExerciseProgress as jest.Mock).mockReturnValue({ progress, loading: false, isError, refetch });
};

function renderProgress() {
  return renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ExerciseProgressScreen />
    </SafeAreaProvider>,
  );
}

type Tree = ReturnType<typeof renderProgress>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;
// findAll sees the Pressable and its host view, so check presence, not a count.
const retryButtons = (tree: Tree) =>
  findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain && typeof p.onPress === 'function');

beforeEach(() => {
  refetch.mockClear();
  (useExercises as jest.Mock).mockReturnValue({ exercises: [], loading: false });
});

test('a failed read shows the load-failed notice with Try again', () => {
  mockProgress(null, true);
  const tree = renderProgress();

  expect(hasText(tree, en.gym.loadFailed)).toBe(true);
  expect(hasText(tree, en.common.tryAgain)).toBe(true);
  expect(retryButtons(tree).length).toBeGreaterThan(0);
});

test('pressing Try again calls refetch once', () => {
  mockProgress(null, true);
  const tree = renderProgress();

  act(() => {
    (retryButtons(tree)[0].props.onPress as () => void)();
  });
  expect(refetch).toHaveBeenCalledTimes(1);
});

test('loaded data shows no error notice', () => {
  mockProgress(PROGRESS, false);
  const tree = renderProgress();

  expect(hasText(tree, en.gym.loadFailed)).toBe(false);
  expect(retryButtons(tree).length).toBe(0);
});
