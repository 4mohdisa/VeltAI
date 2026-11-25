// PHASE3_ROWS.md row 14, Gym exercise progress (src/app/gym/exercise-progress.tsx)
// states. @/lib/api is mocked at the same boundary as exerciseProgress.render.test.tsx,
// so the real useExerciseProgress and useExercises hooks run. A failed progress
// read shows the LoadFailedNotice, not the empty state; a successful empty read
// shows the empty state; the copy is read from en.json, then checked in Spanish.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ExerciseProgressScreen from '@/app/gym/exercise-progress';
import i18n from '@/lib/i18n';
import en from '@/lib/i18n/locales/en.json';
import es from '@/lib/i18n/locales/es.json';
import { act, findAll, renderScreen } from './helpers';

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

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ name: 'Bench press' }),
  usePathname: () => '/gym/exercise-progress',
  Href: {},
}));

jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const settle = async () => {
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
};

async function renderProgress() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ExerciseProgressScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof renderProgress>>;
const hasText = (tree: Tree, text: string) => findAll(tree, (p) => p.children === text).length > 0;

beforeEach(() => {
  mockGetExerciseProgress.mockReset();
  mockGetExercises.mockReset();
  mockGetExercises.mockResolvedValue([]);
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

test('a failed progress read shows the load failure, not the empty state', async () => {
  mockGetExerciseProgress.mockRejectedValue(new Error('Network request failed'));
  const tree = await renderProgress();

  expect(hasText(tree, en.gym.loadFailed)).toBe(true);
  expect(hasText(tree, en.gymExerciseProgress.emptyTitle)).toBe(false);
  // findAll sees the Pressable and its host view, so check presence, not a count.
  expect(findAll(tree, (p) => p.accessibilityLabel === en.common.tryAgain).length).toBeGreaterThan(0);
});

test('a successful read with no progress shows the empty state', async () => {
  mockGetExerciseProgress.mockResolvedValue(null);
  const tree = await renderProgress();

  expect(hasText(tree, en.gymExerciseProgress.emptyTitle)).toBe(true);
  expect(hasText(tree, en.gymExerciseProgress.emptyMessage)).toBe(true);
  expect(hasText(tree, en.gym.loadFailed)).toBe(false);
});

test('Spanish: the empty state and form guide read from es.json', async () => {
  await act(async () => {
    await i18n.changeLanguage('es');
  });
  mockGetExerciseProgress.mockResolvedValue(null);
  const tree = await renderProgress();

  expect(hasText(tree, es.gymExerciseProgress.emptyTitle)).toBe(true);
  expect(hasText(tree, es.gymExerciseProgress.emptyMessage)).toBe(true);
  expect(hasText(tree, es.gymExerciseProgress.guide.press[0])).toBe(true);
});
