// Gym "Exercise progress" detail (PHASE2_ROWS.md row 11, exercise-progress
// screen only) — no render test ever mounted this screen before. This
// EXECUTES the real screen: src/app/gym/exercise-progress.tsx, whose data
// hooks are useExerciseProgress() (api.gym.getExerciseProgress) and
// useExercises() (api.gym.getExercises). Mocked at that one module boundary,
// so the real hooks and the screen's own history/empty-state logic run.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ExerciseProgressScreen from '@/app/gym/exercise-progress';
import { act, allText, renderScreen } from './helpers';

const mockGetExerciseProgress = jest.fn();
const mockGetExercises = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    gym: {
      getExerciseProgress: (...args: unknown[]) => mockGetExerciseProgress(...args),
      getExercises: (...args: unknown[]) => mockGetExercises(...args),
    },
  },
}));

// This screen is the first render test to need the `name` route param — the
// shared expo-router mock (render/setup.ts) always answers useLocalSearchParams
// with `{}`, so it's overridden here with a jest.fn() each test can set.
const mockParams = jest.fn((): { name?: string } => ({ name: 'Bench press' }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams(),
  usePathname: () => '/gym/exercise-progress',
  Href: {},
}));

// Skeleton animates through reanimated's useReducedMotion, which this render
// environment does not provide (same gap noted in schedule.render.test.tsx)
// — it crashes the moment either hook's initial `loading: true` render hits
// it, before either fixture ever resolves. Neither test below is about the
// loading state, so a plain stand-in is enough.
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const BENCH_PRESS: { id: string; name: string; muscle_group_primary: string; muscle_groups_secondary: string[]; category: string; exercise_type: string; equipment: string; difficulty: string; description: string; met_value: number } = {
  id: 'ex1',
  name: 'Bench press',
  muscle_group_primary: 'chest',
  muscle_groups_secondary: ['triceps'],
  category: 'push',
  exercise_type: 'strength',
  equipment: 'barbell',
  difficulty: 'intermediate',
  description: '',
  met_value: 5,
};

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

const renderWithInsets = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ExerciseProgressScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  mockParams.mockReturnValue({ name: 'Bench press' });
  mockGetExerciseProgress.mockReset();
  mockGetExercises.mockReset();
});

test('renders the muscles, form guide and history from the mocked progress data', async () => {
  mockGetExercises.mockResolvedValue([BENCH_PRESS]);
  mockGetExerciseProgress.mockResolvedValue({
    exercise_name: 'Bench press',
    trend: 'improving',
    personal_best: { weight: 80, reps: 5, date: '2026-11-10' },
    history: [
      { date: '2026-11-01', weight: 70, reps: 8, sets: 3 },
      { date: '2026-11-08', weight: 75, reps: 8, sets: 3 },
      { date: '2026-11-15', weight: 80, reps: 6, sets: 3 },
    ],
  });

  const tree = renderWithInsets();
  await settle();

  const text = allText(tree);
  expect(text).toContain('Bench press');
  expect(text).toContain('Muscles worked');
  expect(text).toContain('Chest');
  expect(text).toContain('Form guide');
  expect(text).toContain('History');
  expect(text).toContain('Latest session');
  expect(text).toContain('Best set');
  expect(text).toContain('80 kg');
});

test('renders the not-enough-data empty state when the progress read is null', async () => {
  mockGetExercises.mockResolvedValue([]);
  mockGetExerciseProgress.mockResolvedValue(null);

  const tree = renderWithInsets();
  await settle();

  const text = allText(tree);
  expect(text).toContain('Not enough data yet');
  expect(text).toContain('Log this exercise 3+ times to see progress');
});
