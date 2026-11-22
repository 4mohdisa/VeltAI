// PHASE3_ROWS.md row 17 gap 3, ExercisePicker (src/components/gym/ExercisePicker.tsx):
// a failed library read shows the LoadFailedNotice (gym.loadFailed), not the
// "No exercises found" claim; a successful empty library still shows it.
// useExercises has no refetch, so the notice offers no Retry.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ExercisePicker } from '@/components/gym/ExercisePicker';
import en from '@/lib/i18n/locales/en.json';
import { findAll, renderScreen } from './helpers';

const mockUseExercises = jest.fn();
jest.mock('@/lib/data/gymSchedule', () => ({
  useExercises: () => mockUseExercises(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

// The FlatList holds a circular prop, so allText cannot serialise it; collect
// the rendered text children instead.
function renderedText(): string[] {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ExercisePicker visible onClose={jest.fn()} onPick={jest.fn()} />
    </SafeAreaProvider>,
  );
  return findAll(tree, (p) => typeof p.children === 'string').map((n) => String(n.props.children));
}

test('a failed library read shows the load-failed notice, not No exercises found', () => {
  mockUseExercises.mockReturnValue({ exercises: [], loading: false, isError: true });
  const text = renderedText();

  expect(text).toContain(en.gym.loadFailed);
  expect(text).not.toContain(en.exercisePicker.noResults);
  expect(text).not.toContain(en.common.tryAgain);
});

test('a successful empty library still shows No exercises found', () => {
  mockUseExercises.mockReturnValue({ exercises: [], loading: false, isError: false });
  const text = renderedText();

  expect(text).toContain(en.exercisePicker.noResults);
  expect(text).not.toContain(en.gym.loadFailed);
});
